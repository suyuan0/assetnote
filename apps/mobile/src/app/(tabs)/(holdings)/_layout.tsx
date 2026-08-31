import Stack from "expo-router/stack"

export default function HoldingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerLargeTitleEnabled: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "持仓" }} />
    </Stack>
  )
}
