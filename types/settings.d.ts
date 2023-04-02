/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   settings.d.ts
 * Created At:  2023-03-26 14:11:02
 * Modified At: 2023-04-02 13:56:07
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
  useContext: boolean
  useStream: boolean
}
