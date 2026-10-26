import { Canvas, Group, Path } from '@shopify/react-native-skia';

type Props = {
  path: string;
  color: string;
  size: number;
};

// One landmark silhouette (100 x 100 artwork) scaled to `size`
export function LandmarkArt({ path, color, size }: Props) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale: size / 100 }]}>
        <Path path={path} color={color} />
      </Group>
    </Canvas>
  );
}
