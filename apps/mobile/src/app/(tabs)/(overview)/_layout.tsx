import Stack from "expo-router/stack"

export default function OverviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerLargeTitleEnabled: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "总览" }} />
    </Stack>
  )
}
