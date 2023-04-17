/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   settings.d.ts
 * Created At:  2023-03-26 14:11:02
 * Modified At: Mon Apr 17 2023
 * Modified By: thepoy
 */

declare type Protocol = 'http://' | 'https://' | 'socks5://' | 'socks5h://'

declare interface Proxy {
  protocol?: Protocol
  host?: string
  port?: number
}

declare type ReverseProxy = string

type ProxyMethod = 'proxy' | 'reverse-proxy'

declare interface Config {
  proxy?: {
    method: ProxyMethod
    proxy?: Proxy
    reverseProxy?: ReverseProxy
  }
  prompt: PromptConfig
  export: ExportConfig
  openApiKey: string
  imageScale: number
  useStream: boolean
  topics?: Record<string, TopicConfig>
}

declare interface ExportConfig {
  markdown: MarkdownConfig
}

declare interface MarkdownConfig {
  mode: number
}

declare interface TopicConfig {
  use_context: boolean
  conversation_count: number
  use_first_conversation: boolean
  system_role: string
}

declare interface PromptConfig {
  inChinese: boolean
}

interface PromptSettingsProps {
  open: boolean
  closeSettings?: () => void
  config?: PromptConfig
  onSettingsChange?: (
    promptConfig: PromptConfig
  ) => void
}

interface TopicSettingsProps extends PromptSettingsProps {
  topicID?: string
  name?: string
  config?: TopicConfig
  description?: string
  onSettingsChange?: (topicID: string, config: TopicConfig) => void
}
