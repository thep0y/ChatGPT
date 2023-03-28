import React, { useState, lazy, useEffect, useCallback } from 'react'
import { Layout, FloatButton, Spin, message } from 'antd'
import { SettingOutlined, OrderedListOutlined } from '@ant-design/icons'
import { invoke } from '@tauri-apps/api'
import { isEqual, now, proxyToString, readConfig, saveConfig } from '~/lib'
import '~/styles/ChatPage.scss'
import { addNewLine } from '~/lib/message'
import { smoothScrollTo } from '~/components/scrollbar'
import { appWindow } from '@tauri-apps/api/window'

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
    const fetchConfig = async (): Promise<void> => {
      const config = await readConfig()

      setConfig(config)

      // 没有配置 api key
      if (config.openApiKey === '') {
        setOpenSetting(true)
      }
    }

    void fetchConfig()
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

  const handleSendMessage = useCallback(async (content: string, stream: boolean = true): Promise<void> => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content, role: 'user', time: now() }
    ])
    // TODO: 使用 Tauri API 发送消息并接收 ChatGPT 的回复

    setWaiting(true)

    try {
      const request: ChatGPTRequest = {
        messages: [{
          role: 'user',
          content
        }],
        model: 'gpt-3.5-turbo',
        stream
      }

      if (stream) {
        let role: Role = 'assistant'

        const unlisten = await appWindow.listen<string>('stream', (v) => {
          const payload = v.payload.trim()

          if (payload === 'data: [DONE]') {
            return
          }

          const slices = payload.split('\n')

          console.log('流式响应块', slices)

          if (slices.length === 3) {
            const first = JSON.parse(slices[0].slice(6)) as ChatGPTResponse<StreamChoice>

            // slices 为 3 且 role 存在时会包含部分有效信息
            if (first.choices[0].delta.role != null) {
              role = first.choices[0].delta.role
              const second = JSON.parse(slices[2].slice(6)) as ChatGPTResponse<StreamChoice>

              setMessages((prevMessages) => [
                ...prevMessages,
                {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  content: second.choices[0].delta.content!,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  role,
                  time: first.created * 1000
                }
              ])

              return
            }

            // slices 为 3 且第一个不是 role 时将其 content 追加到队列的最后一个消息中
            setMessages((prevMessages) => [
              ...prevMessages.slice(0, prevMessages.length - 1),
              {
                ...prevMessages[prevMessages.length - 1],
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                content: prevMessages[prevMessages.length - 1].content + (first.choices[0].delta.content ?? '')
              }
            ])

            return
          }

          const chunk = JSON.parse(slices[0].slice(6)) as ChatGPTResponse<StreamChoice>

          if (chunk.choices[0].delta.role != null) {
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                content: '',
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                role: chunk.choices[0].delta.role!,
                time: chunk.created * 1000
              }
            ])
          }
          if (chunk.choices[0].delta.content != null) {
            setMessages((prevMessages) => [
              ...prevMessages.slice(0, prevMessages.length - 1),
              {
                ...prevMessages[prevMessages.length - 1],
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                content: prevMessages[prevMessages.length - 1].content + chunk.choices[0].delta.content!
              }
            ])
          }

          if (chunk.choices[0].finish_reason != null && chunk.choices[0].finish_reason !== 'stop') {
            void message.error('网络异常，消息未接收完整')
          }
        })

        await invoke('chat_gpt_stream', {
          proxy: proxyToString(config?.proxy),
          apiKey: config?.openApiKey,
          request
        })

        unlisten()
      } else {
        const resp = await invoke<ChatGPTResponse<Choice>>('chat_gpt', {
          proxy: proxyToString(config?.proxy),
          apiKey: config?.openApiKey,
          request
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
      }
    } catch (e) {
      await message.error((e as any))
    } finally {
      setWaiting(false)
    }
  }, [config])

  const handleConfigChange = (newConfig: Config): void => {
    setConfig(newConfig)
    setOpenSetting(false)

    if (isEqual(config, newConfig)) return

    void saveConfig(newConfig)
  }

  const closeSettings = (): void => {
    setOpenSetting(false)
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

      <FloatButton
        icon={<OrderedListOutlined />}
        style={{ right: 60 }}
        onClick={async () => {
          const topics = await invoke('get_all_topics')

          console.log(topics)
        }}
      />

      <Settings
        config={config}
        open={openSetting}
        // onCreate={onCreate}
        closeSettings={closeSettings}
        onConfigChange={handleConfigChange}
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
                config={config}
              />
            </Scrollbar>
          </React.Suspense>
        </Content>
      </Layout>
    </>
  )
}

export default ChatPage
