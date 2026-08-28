import type { ReactNode } from "react"
import { ScrollView, StyleSheet, Text, useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type ScreenMessageProps = {
  children?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}

const palettes = {
  dark: {
    background: "#0f172a",
    description: "#cbd5e1",
    eyebrow: "#60a5fa",
    title: "#f8fafc",
  },
  light: {
    background: "#f7f8fa",
    description: "#4b5563",
    eyebrow: "#2563eb",
    title: "#111827",
  },
} as const

export function ScreenMessage({
  children,
  description,
  eyebrow,
  title,
}: ScreenMessageProps) {
  const colorScheme = useColorScheme()
  const palette = colorScheme === "dark" ? palettes.dark : palettes.light

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
      >
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: palette.title }]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: palette.description }]}>
            {description}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    alignItems: "flex-start",
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  scrollView: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    marginTop: 16,
    maxWidth: 360,
  },
})
