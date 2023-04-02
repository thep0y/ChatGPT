import React, { useState, lazy, useEffect, useCallback } from 'react'
import { Layout, FloatButton, Spin, message } from 'antd'
import { SettingOutlined, MenuOutlined } from '@ant-design/icons'
import { invoke } from '@tauri-apps/api'
import { type Event } from '@tauri-apps/api/event'
import { isEqual, now, readConfig, saveConfig } from '~/lib'
import { useParams } from 'react-router-dom'
import { addNewLine } from '~/lib/message'
import { smoothScrollTo } from '~/components/scrollbar'
import { appWindow } from '@tauri-apps/api/window'
import '~/styles/ChatPage.scss'

const Chat = lazy(async () => await import('~/components/Chat'))
const Scrollbar = lazy(
  async () => await import('~/components/scrollbar/Scrollbar')
)
const Settings = lazy(async () => await import('~/components/Settings'))
const Menu = lazy(async () => await import('~/components/Menu'))
const MessageInput = lazy(
  async () => await import('~/components/message/Input')
)

// const { Header, Content } = Layout
const { Content, Sider } = Layout

const handleStreamResponse = async (
  e: Event<string | MessageChunk>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): Promise<void> => {
  const payload = e.payload

  if (typeof payload === 'string') {
    if (payload === 'done') {
      await message.success('文字流接收完成')
    } else {
      // 应该不存在其他文字的可能性
    }

    return
  }

  const choice = payload.choices[0]

  if (choice.delta.role != null) {
    void message.success('开始接收文字流')

    // 消息列表里添加一条消息
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: '',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        role: choice.delta.role!,
        time: payload.created * 1000
      }
    ])

    console.log('流消息', '添加一条消息')

    return
  }

  if (choice.finish_reason === null) {
    setMessages((prevMessages) => [
      ...prevMessages.slice(0, prevMessages.length - 1),
      {
        ...prevMessages[prevMessages.length - 1],
        content:
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          prevMessages[prevMessages.length - 1].content + choice.delta.content!
      }
    ])

    console.log('流消息', '向最后一条消息的 content 中添加文字')

    return
  }

  if (choice.finish_reason === 'stop') {
    // 结束
  } else {
    // 其他异常:https://platform.openai.com/docs/guides/chat/response-format
    await message.error('网络异常，消息未接收完整')
  }
}

const messageExists = (messages: Message[], time: number): boolean => {
  for (const m of messages) {
    if (m.time === time) {
      return true
    }
  }

  return false
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [waiting, setWaiting] = useState<boolean>(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)
  const { topicID } = useParams<'topicID'>()

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      const config = await readConfig()

      setConfig(config)

      // 没有配置 api key
      if (!config || config.openApiKey === '') {
        setOpenSetting(true)
      }
    }

    void fetchConfig()
  }, [])

  const getMessagesByTopic = async (): Promise<void> => {
    try {
      const conversations = await invoke<Conversation[]>(
        'get_messages_by_topic_id',
        { topicId: 1 }
      )

      for (const c of conversations) {
        const userMessage: Message = {
          content: c.user.message,
          time: c.user.created_at,
          role: 'user'
        }
        const assistantMessage: Message = {
          content: c.assistant.message,
          time: c.assistant.created_at * 1000,
          role: 'assistant'
        }

        setMessages((pre) => {
          if (!messageExists(pre, userMessage.time)) {
            return [...pre, userMessage, assistantMessage]
          }

          return pre
        })
      }
    } catch (e) {
      void message.error((e as any).toString())
    }
  }

  useEffect(() => {
    void getMessagesByTopic()
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

  const handleSendMessage = useCallback(
    async (content: string, stream: boolean = true): Promise<void> => {
      const created = now()

      setMessages((prevMessages) => [
        ...prevMessages,
        { content, role: 'user', time: created }
      ])

      setWaiting(true)

      try {
        const request: ChatGPTRequest = {
          messages: [
            {
              role: 'user',
              content
            }
          ],
          model: 'gpt-3.5-turbo',
          stream
        }

        if (stream) {
          // const role: Role = 'assistant'

          const unlisten = await appWindow.listen<string>(
            'stream',
            async (e) => {
              await handleStreamResponse(e, setMessages)
            }
          )

          console.log('使用的代理配置', config?.proxy)

          const messageID = await invoke<number>('chat_gpt_stream', {
            proxyConfig: {
              ...config?.proxy,
              reverse_proxy: config?.proxy?.reverseProxy
            },
            apiKey: config?.openApiKey,
            request,
            created
          })

          console.log('用户消息 id', messageID)

          unlisten()
        } else {
          const resp = await invoke<ChatGPTResponse<Choice>>('chat_gpt', {
            proxyConfig: {
              ...config?.proxy,
              reverse_proxy: config?.proxy?.reverseProxy
            },
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
        await message.error(e as any)
      } finally {
        setWaiting(false)
      }
    },
    [config, messages]
  )

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
        style={{ right: 8, bottom: 110 }}
        onClick={() => {
          setOpenSetting(true)
        }}
      />

      <FloatButton
        icon={<MenuOutlined />}
        style={{ right: 8 }}
        onClick={() => {
          setShowMenu((pre) => !pre)
        }}
      />

      {/* <FloatButton
        icon={<OrderedListOutlined />}
        style={{ right: 60 }}
        onClick={async () => {
          const topics = await invoke('get_topics')

          console.log('主题列表', topics)
        }}
      /> */}

      <Settings
        config={config}
        open={openSetting}
        // onCreate={onCreate}
        closeSettings={closeSettings}
        onConfigChange={handleConfigChange}
      />

      <Layout className="layout">
        {/* <Header className="chat-title">
        <h2> 这是对话标题，使用上下文时此处显示对话主题 </h2>
      </Header> */}

        {showMenu
          ? (
            <Sider>
              <React.Suspense fallback={null}>
                <Menu selectedID={topicID ?? '1'} />
              </React.Suspense>
            </Sider>
            )
          : null}

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

          <React.Suspense fallback={null}>
            <MessageInput
              onSendMessage={handleSendMessage}
              waiting={waiting}
              config={config}
            />
          </React.Suspense>
        </Content>
      </Layout>
    </>
  )
}

export default ChatPage
