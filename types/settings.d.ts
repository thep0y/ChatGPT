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
  openApiKey: string
  imageScale: number
  useStream: boolean
  topics?: Record<string, TopicConfig>
}

declare interface TopicConfig {
  use_context: boolean
  conversation_count: number
  use_first_conversation: boolean
  system_role: string
}

interface PromptSettingsProps {
  open: boolean
  closeSettings?: () => void
  config?: TopicConfig
  onSettingsChange?: (topicID: string, config: TopicConfig) => void
}

interface TopicSettingsProps extends PromptSettingsProps {
  topicID?: string
  name?: string
  description?: string
}
