/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   settings.d.ts
 * Created At:  2023-03-26 14:11:02
 * Modified At: Fri Apr 14 2023
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

interface TopicSettingsProps {
  open: boolean
  closeSettings?: () => void
  topicID?: string
  config?: TopicConfig
  name?: string
  description?: string
  onSettingsChange?: (topicID: string, config: TopicConfig) => void
}
