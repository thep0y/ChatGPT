/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   config.ts
 * Created At:  2023-03-26 18:30:56
 * Modified At: 2023-04-30 18:49:04
 * Modified By: thepoy
 */

import { invoke } from '@tauri-apps/api'
import { message } from 'antd'

export const defaultConfig: Config = {
  proxy: undefined,
  openApiKey: '',
  imageScale: 4,
  useStream: true,
  useEnter: false,
  showLineNumbers: false,
  isOnTop: true,
  prompt: {
    inChinese: true,
  },
  export: {
    markdown: {
      mode: 1,
    },
  },
}

interface PromptStruct {
  in_chinese: boolean
}

interface ConfigStruct {
  proxy: {
    method: ProxyMethod
    proxy?: Proxy
    reverse_proxy?: ReverseProxy
  }
  prompt: PromptStruct
  open_api_key: string
  image_scale: number
  use_stream: boolean
  use_enter: boolean
  show_line_numbers: boolean
  is_on_top: boolean
  topics?: Record<string, TopicConfig>
  export?: ExportConfig
}

export const PROTOCOLS = [
  [
    {
      value: 'http://',
      label: 'http',
    },
    {
      value: 'https://',
      label: 'https',
    },
    {
      value: 'socks5://',
      label: 'socks5',
    },
    {
      value: 'socks5h://',
      label: 'socks5h',
    },
  ],
]

export const readConfig = async (): Promise<Config> => {
  try {
    const config = await invoke<ConfigStruct>('read_config')

    console.log('读取的配置文件', config)

    if (config === null || config.open_api_key === '') {
      await message.warning('配置文件不存在，请先填写关键配置信息')
    }

    return {
      proxy: {
        method: config?.proxy?.method,
        proxy: config?.proxy?.proxy,
        reverseProxy: config?.proxy?.reverse_proxy,
      },
      prompt: { inChinese: config?.prompt?.in_chinese ?? true },
      openApiKey: config?.open_api_key ?? '',
      imageScale: config?.image_scale ?? 4,
      useStream: config?.use_stream ?? true,
      useEnter: config?.use_enter ?? false,
      showLineNumbers: config?.show_line_numbers ?? false,
      topics: config?.topics,
      isOnTop: config?.is_on_top,
      export: {
        markdown: {
          mode: config.export?.markdown?.mode ?? 1,
        },
      },
    }
  } catch (e) {
    void message.error(String(e))

    return defaultConfig
  }
}

export const saveConfig = async (config: Config): Promise<void> => {
  try {
    const configStruct: ConfigStruct = {
      proxy: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...config.proxy!,
        reverse_proxy: config.proxy?.reverseProxy,
      },
      prompt: { in_chinese: config.prompt.inChinese },
      open_api_key: config.openApiKey,
      image_scale: config.imageScale,
      use_stream: config.useStream,
      use_enter: config.useEnter,
      show_line_numbers: config.showLineNumbers,
      topics: config.topics,
      export: config.export,
      is_on_top: config.isOnTop,
    }

    await invoke('write_config', { config: configStruct })

    return
  } catch (e) {
    void message.error(String(e))
  }
}

export const proxyToString = (proxy?: Proxy): string | null => {
  const { protocol, host, port } = proxy ?? {}

  return protocol && host && port ? `${protocol}${host}:${port}` : null
}
