import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import type { SharedValue } from 'react-native-reanimated';
import { scrollOffsetFor, Segment, SEGMENTS } from './layout';
import { WorldChunk } from './WorldChunk';

type Props = {
  currentLevel: number;
  stars: Record<number, number>;
  reduceMotion: boolean;
  // Bump `seq` to scroll to `level` again, even if it is the same level
  focus: { level: number; seq: number };
  scrollY: SharedValue<number>;
  onPressLevel: (levelId: number) => void;
};

export function RouteMap({ currentLevel, stars, reduceMotion, focus, scrollY, onPressLevel }: Props) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlashListRef<Segment>>(null);
  const [loaded, setLoaded] = useState(false);

  const scrollTo = useCallback(
    (level: number, animated: boolean) => {
      listRef.current?.scrollToOffset({ offset: scrollOffsetFor(level, height), animated });
    },
    [height],
  );

  // First open: jump straight to the current stop
  const handleLoad = useCallback(() => {
    scrollTo(focus.level, false);
    setLoaded(true);
  }, [scrollTo, focus.level]);

  // Later focus requests (back from a level, or a world picked on the globe) glide there
  useEffect(() => {
    if (loaded) scrollTo(focus.level, !reduceMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new requests
  }, [focus.seq]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  return (
    <FlashList
      ref={listRef}
      data={SEGMENTS}
      keyExtractor={s => s.key}
      renderItem={({ item }) => (
        <WorldChunk
          segment={item}
          width={width}
          currentLevel={currentLevel}
          stars={stars}
          reduceMotion={reduceMotion}
          onPressLevel={onPressLevel}
        />
      )}
      extraData={{ currentLevel, stars, reduceMotion, width }}
      onLoad={handleLoad}
      onScroll={handleScroll}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      maintainVisibleContentPosition={{ disabled: true }}
    />
  );
}
