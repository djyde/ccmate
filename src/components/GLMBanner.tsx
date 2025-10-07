// !!!IMPORTANT: Please DO NOT localize this file

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { openUrl } from "@tauri-apps/plugin-opener"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "./ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { CircleQuestionMarkIcon, ExternalLinkIcon } from "lucide-react"
import { Input } from "./ui/input"
import { useCreateConfig, useSetCurrentConfig } from "@/lib/query"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function GLMBanner(props: {
  className?: string,
  hideCloseButton?: boolean
}) {
  const { i18n } = useTranslation()
  const [isDismissed, setIsDismissed] = useState(localStorage.getItem('glm-banner-dismissed') === 'true')

  const handleDismiss = () => {
    localStorage.setItem('glm-banner-dismissed', 'true')
    setIsDismissed(true)
  }

  // Only show banner when locale is Chinese
  if (i18n.language !== 'zh' || isDismissed) {
    return null
  }

  return (
    <div className={cn("bg-zinc-50 rounded-md p-2 border border-zinc-200 space-y-2", props.className)}>
      <h3 className="text-zinc-800 text-sm font-medium flex items-center gap-2">在 Claude Code 中使用 GLM 4.6
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <CircleQuestionMarkIcon size={14} className="text-zinc-500" />
            </TooltipTrigger>
            <TooltipContent className="w-[200px]">
              <p className="font-normal">「在公开基准与真实编程任务中，GLM-4.6 的代码能力对齐 Claude Sonnet 4，是国内已知的最好的 Coding 模型」 —— 智谱官方文档</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <div className="flex items-center gap-1">
        <GLMDialog
          trigger={
            <Button size="sm" variant="outline" className="text-sm">
              开始配置
            </Button>
          }
          onSuccess={handleDismiss}
        />
        {!props.hideCloseButton && <Button size="sm" variant="ghost" className="text-sm" onClick={handleDismiss}>
          关闭
        </Button>}
      </div>
    </div>
  )
}

export function GLMDialog(props: {
  trigger: React.ReactNode
  onSuccess?: () => void
}) {
  const [apiKey, setApiKey] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const createConfigMutation = useCreateConfig()
  const setCurrentConfigMutation = useSetCurrentConfig()

  const handleCreateConfig = async () => {
    if (!apiKey.trim()) {
      return
    }

    try {
      const store = await createConfigMutation.mutateAsync({
        title: "智谱 GLM",
        settings: {
          env: {
            ANTHROPIC_AUTH_TOKEN: apiKey.trim(),
            ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
            ANTHROPIC_MODEL: 'GLM-4.6',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'GLM-4.6',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'GLM-4.6',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'GLM-4.5-Air'
          }
        }
      })

      // Set the newly created config as the current/active config
      await setCurrentConfigMutation.mutateAsync(store.id)

      setIsOpen(false)
      setApiKey("")
      navigate(`/edit/${store.id}`)

      // Call onSuccess callback to dismiss the banner
      props.onSuccess?.()
    } catch (error) {
      console.error("Failed to create GLM config:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {props.trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            配置智谱 GLM
          </DialogTitle>
          <DialogDescription>
            在 Claude Code 中使用智谱 GLM
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-zinc-800 text-sm font-medium flex items-center gap-2">
                第 1 步：购买 GLM 编码畅玩套餐
              </h2>
              <div className="space-y-2 bg-zinc-100 p-3 rounded-lg m-2">
                <Button onClick={_ => {
                  openUrl("https://www.bigmodel.cn/claude-code?ic=UP1VEQEATH")
                }} size="sm" variant="outline" className="text-sm">
                  <ExternalLinkIcon />
                  前往官网购买
                </Button>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  使用此按钮购买时，下单立减10%金额（官方活动）</p>
              </div>
            </div>

            <div>
              <h2 className="text-zinc-800 text-sm font-medium flex items-center gap-2">
                第 2 步：创建 API Key
              </h2>
              <div className="space-y-2 bg-zinc-100 p-3 rounded-lg m-2">
                <Button onClick={_ => {
                  openUrl("https://bigmodel.cn/usercenter/proj-mgmt/apikeys")
                }} size="sm" variant="outline" className="text-sm">
                  <ExternalLinkIcon />
                  进入控制台
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-zinc-800 text-sm font-medium flex items-center gap-2">
                第 3 步：输入 API Key
              </h2>
              <div className="space-y-2 bg-zinc-100 p-3 rounded-lg m-2">
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的 API Key"
                />
              </div>
            </div>

            <div className="flex justify-end mx-2 mt-2">
              <Button
                onClick={handleCreateConfig}
                disabled={!apiKey.trim() || createConfigMutation.isPending}
              >
                {createConfigMutation.isPending ? "创建中..." : "创建配置"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}