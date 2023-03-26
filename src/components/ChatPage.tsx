import React, { useState, lazy, useEffect, useCallback } from 'react'
import { Layout, FloatButton, Spin } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { invoke } from '@tauri-apps/api'
import { now, readConfig, saveConfig } from '~/lib'
import '~/styles/ChatPage.scss'
import { addNewLine } from '~/lib/message'
import { smoothScrollTo } from '~/components/scrollbar'

const Chat = lazy(async () => await import('~/components/Chat'))
const Scrollbar = lazy(async () => await import('~/components/scrollbar/Scrollbar'))
const Settings = lazy(async () => await import('~/components/Settings'))

// const { Header, Content } = Layout
const { Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(
    JSON.parse(import.meta.env.VITE_MESSAGES)
  )
  const [waiting, setWaiting] = useState<boolean>(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    async function fetchConfig () {
      const config = await readConfig()

      setConfig(config)
    }

    fetchConfig()
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    const scrollbar = document.getElementById('custom-scrollbar')

    if (scrollbar != null) {
      smoothScrollTo(scrollbar, scrollbar.scrollHeight, 1000)
    }
  }, [])

  // 监听消息变化并滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(async (message: string): Promise<void> => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: message, role: 'user', time: now() }
    ])
    // TODO: 使用 Tauri API 发送消息并接收 ChatGPT 的回复

    setWaiting(true)

    try {
      const resp = await invoke<ChatGPTResponse>('chat_gpt', {
        text: message,
        model: ''
      })

      // chatgpt 的响应的时间戳是精确到秒的，需要 x1000 js 才能正确识别
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: addNewLine(resp.choices[0].message.content),
          role: resp.choices[0].message.role,
          time: resp.created * 1000
        }
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setWaiting(false)
    }
  }, [])

  const handleSettingsChange = (newConfig: Config): void => {
    setConfig(newConfig)
    setOpenSetting(false)

    void saveConfig(newConfig)
  }

  if (config == null) {
    return (
      <Spin tip="正在读取配置文件">
        <div className="content" />
      </Spin>
    )
  }

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        style={{ right: 8 }}
        onClick={() => {
          setOpenSetting(true)
        }}
      />

      <Settings
        settings={config}
        open={openSetting}
        // onCreate={onCreate}
        onCancel={() => {
          setOpenSetting(false)
        }}
        onSettingsChange={handleSettingsChange}
      />

      <Layout>
        {/* <Header className="chat-title">
        <h2> 这是对话标题，使用上下文时此处显示对话主题 </h2>
      </Header> */}

        <Content>
          <React.Suspense fallback={null}>
            <Scrollbar>
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                waiting={waiting}
              />
            </Scrollbar>
          </React.Suspense>
        </Content>
      </Layout>
    </>
  )
}

export default ChatPage
