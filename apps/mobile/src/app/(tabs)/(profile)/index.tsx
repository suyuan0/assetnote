import { useTheme } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"

export default function ProfileScreen() {
  const { colors, dark } = useTheme()
  const secondaryTextColor = dark ? "#98989D" : "#6D6D72"

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarLabel}>AN</Text>
        </View>
        <View style={styles.identity}>
          <Text selectable style={[styles.name, { color: colors.text }]}>
            未登录
          </Text>
          <Text
            selectable
            style={[styles.description, { color: secondaryTextColor }]}
          >
            登录后同步你的账户与持仓数据
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  profileCard: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 20,
    flexDirection: "row",
    gap: 16,
    padding: 20,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  avatarLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
  },
})
