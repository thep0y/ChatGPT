/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   config.ts
 * Created At:  2023-03-26 18:30:56
 * Modified At: 2023-03-26 19:24:43
 * Modified By: thepoy
 */

import { invoke } from '@tauri-apps/api'
import { message } from 'antd'

export const defaultConfig: Config = {
  proxy: {
    protocol: 'socks5://',
    host: 'localhost',
    port: 1080
  },
  openApiKey: '',
  imageScale: 4,
  useContext: false
}

interface ConfigStruct {
  proxy: Proxy
  open_api_key: string
  image_scale: number
  use_context: boolean
}

export const readConfig = async (): Promise<Config> => {
  try {
    const config = await invoke<ConfigStruct>('read_config')

    if (config.open_api_key === '') {
      await message.warning('配置文件不存在，使用初始配置')
    }

    return {
      proxy: config.proxy,
      openApiKey: config.open_api_key,
      imageScale: config.image_scale,
      useContext: config.use_context
    }
  } catch (e) {
    await message.error((e as any).toString())

    return defaultConfig
  }
}

export const saveConfig = async (config: Config): Promise<void> => {
  try {
    const configStruct: ConfigStruct = {
      proxy: config.proxy,
      open_api_key: config.openApiKey,
      image_scale: config.imageScale,
      use_context: config.useContext
    }

    await invoke('write_config', { config: configStruct })

    return
  } catch (e) {
    await message.error((e as any).toString())
  }
}
