import { ScreenMessage } from "@/components/screen-message"
import { Link } from "expo-router"
import { StyleSheet } from "react-native"

export default function NotFoundScreen() {
  return (
    <ScreenMessage title="页面不存在">
      <Link accessibilityRole="link" href="/" style={styles.link}>
        返回首页
      </Link>
    </ScreenMessage>
  )
}

const styles = StyleSheet.create({
  link: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    color: "#1d4ed8",
    fontSize: 17,
    marginTop: 20,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
})
