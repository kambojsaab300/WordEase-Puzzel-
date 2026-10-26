import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = {
  stars: 0 | 1 | 2 | 3;
  size?: number;
};

export function StarRow({ stars, size = 48 }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={`${stars} of 3 stars`}>
      {[1, 2, 3].map(i => (
        <Text
          key={i}
          style={[styles.star, i <= stars ? styles.filled : styles.empty, { fontSize: size }]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 4,
  },
  filled: {
    color: colors.coinGold,
  },
  empty: {
    color: '#D9D2C3',
  },
});
