import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router"
import Stack from "expo-router/stack"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
