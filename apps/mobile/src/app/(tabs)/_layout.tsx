import { NativeTabs } from "expo-router/unstable-native-tabs"

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(overview)">
        <NativeTabs.Trigger.Icon
          md="pie_chart"
          sf={{ default: "chart.pie", selected: "chart.pie.fill" }}
        />
        <NativeTabs.Trigger.Label>总览</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(holdings)">
        <NativeTabs.Trigger.Icon
          md="work"
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
        />
        <NativeTabs.Trigger.Label>持仓</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(records)">
        <NativeTabs.Trigger.Icon
          md="history"
          sf={{ default: "clock", selected: "clock.fill" }}
        />
        <NativeTabs.Trigger.Label>记录</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Icon
          md="account_circle"
          sf={{ default: "person.circle", selected: "person.circle.fill" }}
        />
        <NativeTabs.Trigger.Label>我的</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
