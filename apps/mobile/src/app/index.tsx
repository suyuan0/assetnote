import { ScreenMessage } from "@/components/screen-message"

export default function HomeScreen() {
  return (
    <ScreenMessage
      description="移动端基础架构已就绪。后续业务能力将通过 AssetNote API 接入。"
      eyebrow="ASSETNOTE MOBILE"
      title="资产信息，随时掌握。"
    />
  )
}
