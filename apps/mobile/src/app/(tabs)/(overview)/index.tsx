import { ScrollView, StyleSheet, Text } from "react-native"

export default function OverviewScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <Text selectable style={styles.description}>
        这里将展示总资产、盈亏与资产分布。
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
