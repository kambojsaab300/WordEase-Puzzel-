import { act } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useSettings } from '../src/store/settings';

// Only what the quiz uses from Reanimated: plain views, entering animations and shared values
jest.mock('react-native-reanimated', () => {
  const { Text: RNText, View } = require('react-native');
  return {
    __esModule: true,
    default: { View, Text: RNText },
    ZoomIn: {},
    FadeInDown: {},
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: () => ({}),
    withSequence: () => 0,
    withTiming: () => 0,
    withRepeat: () => 0,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  const Stub = ({ children }: { children?: unknown }) => <View>{children as never}</View>;
  return { Canvas: Stub, Group: Stub, Path: Stub };
});
jest.mock('../src/ui/Confetti', () => ({ Confetti: () => null }));

const { QuizScreen } = require('../src/screens/QuizScreen');
const { getDailyQuiz } = require('../src/game/quiz/dailyQuiz');
const { optionLabel } = require('../src/screens/quiz/QuizCards');
const { getTodayKey } = require('../src/store/daily');
const { useQuiz } = require('../src/store/quiz');
const { useWallet } = require('../src/store/wallet');
const { translate } = require('../src/i18n');

const t = (key: string, params?: Record<string, string | number>) => translate('en', key, params);

describe('Daily Word Quiz screen', () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  const open = () => {
    const navigation = { goBack: jest.fn() };
    act(() => {
      tree = ReactTestRenderer.create(<QuizScreen navigation={navigation as never} route={{ key: 'q', name: 'Quiz' } as never} />);
    });
    return navigation;
  };
  const press = (label: string) => {
    const button = tree.root.findAll(
      n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function' && !n.props.disabled,
    )[0];
    if (!button) throw new Error(`no button "${label}"`);
    act(() => button.props.onPress());
  };
  const texts = () => tree.root.findAllByType(Text).map(n => [n.props.children].flat().join(''));

  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useSettings.setState({ lang: 'en', reduceMotion: false });
      useQuiz.getState().reset();
      useWallet.setState({ coins: 0 });
    });
  });
  afterEach(() => {
    act(() => tree?.unmount());
    jest.useRealTimers();
  });

  test('a full perfect run: intro, five answers, chest and summary', () => {
    const quiz = getDailyQuiz(getTodayKey());
    open();
    expect(texts()).toContain(t('quiz.number', { n: quiz.number }));
    press(t('quiz.start'));

    quiz.questions.forEach((q: any, i: number) => {
      if (q.kind === 'jumble') {
        for (const letter of q.word) press(t('quiz.tileA11y', { letter }));
        press(t('quiz.check'));
      } else {
        press(optionLabel(t, q, q.options[q.answer]));
      }
      expect(useQuiz.getState().today.results[i]).toBe(true);
      press(t(i === quiz.questions.length - 1 ? 'quiz.seeResults' : 'quiz.next'));
    });

    expect(texts()).toContain(t('quiz.score.5'));
    const before = useWallet.getState().coins;
    press(`${t('quiz.chest')}. ${t('quiz.chestTap')}`);
    expect(useWallet.getState().coins).toBe(before + useQuiz.getState().today.chest);
    expect(useQuiz.getState().streak).toBe(1);
  });

  test('a wrong answer shows the right one and pays nothing', () => {
    const quiz = getDailyQuiz(getTodayKey());
    open();
    press(t('quiz.start'));
    const q = quiz.questions[0];
    const wrong = q.options.findIndex((_: string, i: number) => i !== q.answer);
    press(optionLabel(t, q, q.options[wrong]));
    expect(useWallet.getState().coins).toBe(0);
    expect(texts()).toContain(t('quiz.wrong'));
  });

  test('reopening after an answer resumes at the next question (no reroll)', () => {
    const quiz = getDailyQuiz(getTodayKey());
    open();
    press(t('quiz.start'));
    press(optionLabel(t, quiz.questions[0], quiz.questions[0].options[quiz.questions[0].answer]));
    act(() => tree.unmount());
    open();
    expect(tree.root.findAll(n => n.props.accessibilityLabel === t('quiz.progress', { n: 2, total: 5 })).length).toBeGreaterThan(0);
  });
});
