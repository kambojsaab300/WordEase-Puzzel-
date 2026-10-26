import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  RoundedRect,
  Text,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  lineBetween,
  pointToCell,
  selectionFromDrag,
} from '../engine/selection';
import { Cell, DIR_VECTORS, PlacedWord, wordCells } from '../types';
import { AudioManager } from '../../services/audio/AudioManager';
import { HapticsManager } from '../../services/haptics/HapticsManager';
import type { InputMode } from '../../store/settings';
import {
  FOUND_PATTERNS,
  gridLetterSize,
  HIGH_CONTRAST,
  TextSizeIndex,
} from '../../ui/a11y';
import { IconButton } from '../../ui/IconButton';
import { colors, fonts, fontSizes } from '../../ui/theme';
import { NO_ZOOM, pinchZoom, toContent, Zoom, zoomAroundCenter } from './zoom';
import { useT } from '../../i18n';

const LETTER_FONT = require('../../../assets/fonts/AtkinsonHyperlegible-Bold.ttf');

export type FoundWord = { word: PlacedWord; color: string };
export type HintOverlay = { word: PlacedWord; withDirection: boolean };

type Props = {
  grid: string[];
  cellSize: number;
  found: FoundWord[];
  hint: HintOverlay | null;
  inputMode: InputMode;
  reduceMotion: boolean;
  textSize: TextSizeIndex;
  highContrast: boolean;
  colorBlind: boolean;
  // 1 = the whole grid fits comfortably; above 1 = pinch-zoom and zoom buttons are on
  maxZoom: number;
  onSelect: (cells: Cell[]) => void;
};

const CAPSULE_RATIO = 0.78;

type CapsuleProps = {
  cells: Cell[];
  cellSize: number;
  color: string;
  opacity: number;
  pattern?: number[]; // colour-blind mode: dash pattern drawn along the capsule
  outline?: string; // high contrast: dark edge around the capsule
};

function Capsule({
  cells,
  cellSize,
  color,
  opacity,
  pattern,
  outline,
}: CapsuleProps) {
  const center = ([r, c]: Cell) =>
    vec(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
  const width = cellSize * CAPSULE_RATIO;
  const first = cells[0];
  const last = cells[cells.length - 1];

  if (cells.length === 1) {
    const p = center(first);
    return (
      <Circle cx={p.x} cy={p.y} r={width / 2} color={color} opacity={opacity} />
    );
  }
  return (
    <Group>
      {outline && (
        <Line
          p1={center(first)}
          p2={center(last)}
          color={outline}
          style="stroke"
          strokeWidth={width + 3}
          strokeCap="round"
        />
      )}
      <Line
        p1={center(first)}
        p2={center(last)}
        color={color}
        opacity={outline ? 1 : opacity}
        style="stroke"
        strokeWidth={width}
        strokeCap="round"
      />
      {pattern && (
        <Line
          p1={center(first)}
          p2={center(last)}
          color="rgba(0,0,0,0.75)"
          style="stroke"
          strokeWidth={3}
          strokeCap="round"
        >
          {pattern.length > 0 && <DashPathEffect intervals={pattern} />}
        </Line>
      )}
    </Group>
  );
}

export function GridCanvas({
  grid,
  cellSize,
  found,
  hint,
  inputMode,
  reduceMotion,
  textSize,
  highContrast,
  colorBlind,
  maxZoom,
  onSelect,
}: Props) {
  const rows = grid.length;
  const cols = grid[0].length;
  const width = cols * cellSize;
  const height = rows * cellSize;
  const font = useFont(
    LETTER_FONT,
    gridLetterSize(cellSize, textSize, fontSizes.gridLetter),
  );
  const letterColor = highContrast ? HIGH_CONTRAST.letter : colors.ink;
  const t = useT();

  const [selection, setSelection] = useState<Cell[]>([]);
  const startRef = useRef<Cell>([0, 0]);
  const selectionRef = useRef<Cell[]>([]);
  const tapStartRef = useRef<Cell | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Leaving Tap-Tap mode mid-selection should not leave a stray highlight
  useEffect(() => {
    tapStartRef.current = null;
    selectionRef.current = [];
    setSelection([]);
  }, [inputMode]);

  // Zoom lives inside Skia, so letters stay sharp at any scale
  const zScale = useSharedValue(1);
  const zTx = useSharedValue(0);
  const zTy = useSharedValue(0);
  const pinchStart = useSharedValue<Zoom>(NO_ZOOM);
  const focalStart = useSharedValue({ x: 0, y: 0 });
  const zoomTransform = useDerivedValue(() => [
    { translateX: zTx.value },
    { translateY: zTy.value },
    { scale: zScale.value },
  ]);
  const setZoom = useCallback(
    (z: Zoom, animate: boolean) => {
      const timing = { duration: animate && !reduceMotion ? 250 : 0 };
      zScale.value = withTiming(z.scale, timing);
      zTx.value = withTiming(z.tx, timing);
      zTy.value = withTiming(z.ty, timing);
    },
    [zScale, zTx, zTy, reduceMotion],
  );
  // A new grid (or a phone turned sideways) starts fully zoomed out
  useEffect(() => setZoom(NO_ZOOM, false), [grid, maxZoom, cellSize, setZoom]);
  const currentZoom = (): Zoom => ({
    scale: zScale.value,
    tx: zTx.value,
    ty: zTy.value,
  });

  const gesture = useMemo(() => {
    const update = (cells: Cell[]) => {
      selectionRef.current = cells;
      setSelection(cells);
    };

    if (inputMode === 'tap') {
      return Gesture.Tap()
        .runOnJS(true)
        .onEnd((e, success) => {
          if (!success) return;
          const p = toContent(e.x, e.y, currentZoom());
          const cell = pointToCell(p.x, p.y, cellSize, rows, cols);
          const start = tapStartRef.current;
          if (!start) {
            tapStartRef.current = cell;
            update([cell]);
            return;
          }
          tapStartRef.current = null;
          update([]);
          if (start[0] === cell[0] && start[1] === cell[1]) return; // same cell again: cancel
          // Not on a straight line: still report it so the grid can shake
          onSelectRef.current(lineBetween(start, cell) ?? [start, cell]);
        });
    }

    return Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .maxPointers(1) // a second finger means pinch, not a word
      .onBegin(e => {
        const p = toContent(e.x, e.y, currentZoom());
        startRef.current = pointToCell(p.x, p.y, cellSize, rows, cols);
        AudioManager.playLetterTouch();
        update([startRef.current]);
      })
      .onUpdate(e => {
        const [r, c] = startRef.current;
        const p = toContent(e.x, e.y, currentZoom());
        const dx = p.x - (c * cellSize + cellSize / 2);
        const dy = p.y - (r * cellSize + cellSize / 2);
        const next = selectionFromDrag(
          startRef.current,
          dx,
          dy,
          cellSize,
          rows,
          cols,
        );
        if (next.length !== selectionRef.current.length) {
          HapticsManager.selectionTick();
          AudioManager.playDragTick(next.length);
        }
        update(next);
      })
      .onEnd((_e, success) => {
        if (success) onSelectRef.current(selectionRef.current);
      })
      .onFinalize(() => update([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoom shared values are stable
  }, [cellSize, rows, cols, inputMode]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(e => {
          pinchStart.value = {
            scale: zScale.value,
            tx: zTx.value,
            ty: zTy.value,
          };
          focalStart.value = { x: e.focalX, y: e.focalY };
        })
        .onUpdate(e => {
          const z = pinchZoom(
            pinchStart.value,
            focalStart.value,
            e.scale,
            { x: e.focalX, y: e.focalY },
            width,
            height,
            maxZoom,
          );
          zScale.value = z.scale;
          zTx.value = z.tx;
          zTy.value = z.ty;
        }),
    [pinchStart, focalStart, zScale, zTx, zTy, width, height, maxZoom],
  );
  const allGestures =
    maxZoom > 1 ? Gesture.Simultaneous(pinch, gesture) : gesture;

  // Gentle pulse on the hinted first letter
  const pulse = useSharedValue(0.85);
  useEffect(() => {
    pulse.value = reduceMotion
      ? 0.85
      : withRepeat(withTiming(0.35, { duration: 700 }), -1, true);
  }, [pulse, reduceMotion]);

  const letters = useMemo(() => {
    if (!font) return [];
    const baseline = cellSize / 2 + font.getSize() * 0.36;
    return grid.flatMap((row, r) =>
      Array.from(row, (ch, c) => ({
        key: `${r}-${c}`,
        ch,
        x: c * cellSize + (cellSize - font.measureText(ch).width) / 2,
        y: r * cellSize + baseline,
      })),
    );
  }, [font, grid, cellSize]);

  const hintGeometry = useMemo(() => {
    if (!hint) return null;
    const [r, c] = hint.word.start;
    const [dr, dc] = DIR_VECTORS[hint.word.dir];
    const cx = c * cellSize + cellSize / 2;
    const cy = r * cellSize + cellSize / 2;
    return {
      cx,
      cy,
      tip: vec(cx + dc * cellSize * 0.95, cy + dr * cellSize * 0.95),
    };
  }, [hint, cellSize]);

  const zoomBy = (factor: number) =>
    setZoom(
      zoomAroundCenter(currentZoom(), factor, width, height, maxZoom),
      true,
    );

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={allGestures}>
        <Canvas
          style={{ width, height }}
          accessibilityLabel={t(
            inputMode === 'tap' ? 'level.gridA11y.tap' : 'level.gridA11y.drag',
          )}
        >
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={16}
            color={colors.white}
          />
          <Group transform={zoomTransform}>
            {highContrast && (
              <Group>
                {Array.from({ length: rows - 1 }, (_, i) => (
                  <Line
                    key={`r${i}`}
                    p1={vec(0, (i + 1) * cellSize)}
                    p2={vec(width, (i + 1) * cellSize)}
                    color={HIGH_CONTRAST.gridLine}
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: cols - 1 }, (_, i) => (
                  <Line
                    key={`c${i}`}
                    p1={vec((i + 1) * cellSize, 0)}
                    p2={vec((i + 1) * cellSize, height)}
                    color={HIGH_CONTRAST.gridLine}
                    strokeWidth={1}
                  />
                ))}
                <RoundedRect
                  x={1}
                  y={1}
                  width={width - 2}
                  height={height - 2}
                  r={15}
                  color={HIGH_CONTRAST.outline}
                  style="stroke"
                  strokeWidth={2}
                />
              </Group>
            )}
            {found.map((f, i) => (
              <Capsule
                key={f.word.w}
                cells={wordCells(f.word)}
                cellSize={cellSize}
                color={f.color}
                opacity={0.55}
                pattern={
                  colorBlind
                    ? FOUND_PATTERNS[i % FOUND_PATTERNS.length]
                    : undefined
                }
                outline={highContrast ? HIGH_CONTRAST.outline : undefined}
              />
            ))}
            {hintGeometry && (
              <>
                <Circle
                  cx={hintGeometry.cx}
                  cy={hintGeometry.cy}
                  r={(cellSize * CAPSULE_RATIO) / 2}
                  color={colors.coinGold}
                  opacity={pulse}
                />
                {hint?.withDirection && (
                  <>
                    <Line
                      p1={vec(hintGeometry.cx, hintGeometry.cy)}
                      p2={hintGeometry.tip}
                      color={colors.primaryOcean}
                      style="stroke"
                      strokeWidth={6}
                      strokeCap="round"
                    />
                    <Circle
                      cx={hintGeometry.tip.x}
                      cy={hintGeometry.tip.y}
                      r={8}
                      color={colors.primaryOcean}
                    />
                  </>
                )}
              </>
            )}
            {selection.length > 0 && (
              <Capsule
                cells={selection}
                cellSize={cellSize}
                color={
                  highContrast ? HIGH_CONTRAST.selection : colors.accentCoral
                }
                opacity={highContrast ? HIGH_CONTRAST.capsuleOpacity : 0.6}
              />
            )}
            {font &&
              letters.map(l => (
                <Text
                  key={l.key}
                  x={l.x}
                  y={l.y}
                  text={l.ch}
                  font={font}
                  color={letterColor}
                />
              ))}
          </Group>
        </Canvas>
      </GestureDetector>
      {maxZoom > 1 && (
        <View style={styles.zoomRow}>
          <IconButton
            icon="➖"
            label={t('zoom.out')}
            onPress={() => zoomBy(1 / 1.5)}
          />
          <RNText style={styles.zoomHint}>{t('zoom.hint')}</RNText>
          <IconButton
            icon="➕"
            label={t('zoom.in')}
            onPress={() => zoomBy(1.5)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  zoomHint: {
    maxWidth: 170,
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
});
