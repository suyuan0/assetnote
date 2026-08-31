import { ScrollView, StyleSheet, Text } from "react-native"

export default function HoldingsScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <Text selectable style={styles.description}>
        这里将展示持仓列表、成本、市值与收益。
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
  },
})
