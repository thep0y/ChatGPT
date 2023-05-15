import React, {
  useState,
  lazy,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react'
import { Layout, FloatButton, Spin, message, Modal, Row, Col } from 'antd'
import {
  SettingOutlined,
  MenuOutlined,
  ExclamationCircleFilled,
  ReloadOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons'
import { invoke } from '@tauri-apps/api'
import { type Event } from '@tauri-apps/api/event'
import { isEqual, newChatRequest, now, readConfig, saveConfig } from '~/lib'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  PROMPT_ASSISTANT_RESPONSE,
  PROMPT_ASSISTANT_RESPONSE_IN_CHINESE,
  PROMPT_ROLE_MESSAGE,
  PROMPT_ROLE_MESSAGE_IN_CHINESE,
  addNewLine,
  deleteMessage,
} from '~/lib/message'
import { appWindow } from '@tauri-apps/api/window'
import { TauriEvent } from '@tauri-apps/api/event'
import '~/styles/ChatPage.scss'

const Chat = lazy(async () => await import('~/components/Chat'))
const GlobalSettings = lazy(
  async () => await import('~/components/settings/Global')
)
const GlobalFloatButtons = lazy(
  async () => await import('~/components/floatButtons/Global')
)
const Menu = lazy(async () => await import('~/components/Menu'))
const MessageInput = lazy(
  async () => await import('~/components/message/Input')
)

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
        time: payload.created * 1000,
      },
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
          prevMessages[prevMessages.length - 1].content + choice.delta.content!,
      },
    ])

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

const conversationsToMessages = (conversations: Conversation[]): Message[] => {
  const tempMessages: Message[] = []

  for (const c of conversations) {
    const userMessage: Message = {
      content: c.user.message,
      time: c.user.created_at,
      role: 'user',
    }
    const assistantMessage: Message = {
      content: c.assistant.message,
      time: c.assistant.created_at * 1000,
      role: 'assistant',
    }

    if (!messageExists(tempMessages, userMessage.time)) {
      tempMessages.push(userMessage, assistantMessage)
    }
  }

  return tempMessages
}

const addPromptMessages = (
  sendedMessages: ChatMessage[],
  inChinese?: boolean
): void => {
  const roleMessage = inChinese
    ? PROMPT_ROLE_MESSAGE_IN_CHINESE
    : PROMPT_ROLE_MESSAGE
  const assistantMessage = inChinese
    ? PROMPT_ASSISTANT_RESPONSE_IN_CHINESE
    : PROMPT_ASSISTANT_RESPONSE

  sendedMessages.unshift(
    { role: 'user', content: roleMessage },
    { role: 'assistant', content: assistantMessage }
  )
}

const addConversationMessages = (
  sendedMessages: ChatMessage[],
  messages: Message[],
  useFirstConversation: boolean,
  useConversationCount: number
): void => {
  console.log('发送消息列表', sendedMessages)
  console.log('消息列表', messages)

  // 这里的 messages 中尚不包含刚添加的用户消息，对话数量是用户消息之前的对话数量
  const conversationCount = messages.length / 2

  if (conversationCount === 0) return

  if (!Number.isInteger(conversationCount)) {
    throw Error(`对话数量不是整数，messages.length = ${messages.length}`)
  }

  sendedMessages.reverse()

  if (conversationCount <= useConversationCount) {
    sendedMessages.push(...messages.reverse())
  } else {
    const startMessageNo = useFirstConversation
      ? messages.length - (useConversationCount - 1) * 2
      : messages.length - useConversationCount * 2

    console.log('初始消息序号', startMessageNo)

    sendedMessages.push(...messages.slice(startMessageNo).reverse())

    // 如果使用第一组对话
    if (useFirstConversation) {
      sendedMessages.push(messages[1], messages[0])
    }
  }

  sendedMessages.reverse()
}

const addSystemRoleMessage = (
  sendedMessages: ChatMessage[],
  systemRole: string
): void => {
  sendedMessages.unshift({ role: 'system', content: systemRole })
}

const fillMessages = (
  sendedMessages: ChatMessage[],
  messages: Message[],
  topicConfig?: TopicConfig,
  inChinese?: boolean
): void => {
  if (inChinese !== undefined) {
    sendedMessages.unshift(...messages)
    addPromptMessages(sendedMessages, inChinese)
  }

  if (topicConfig?.use_context) {
    addConversationMessages(
      sendedMessages,
      messages,
      topicConfig.use_first_conversation,
      topicConfig.conversation_count
    )
  }

  if (topicConfig?.system_role) {
    addSystemRoleMessage(sendedMessages, topicConfig.system_role)
  }
}

const { confirm } = Modal

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [waiting, setWaiting] = useState<boolean>(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [showTopicList, setShowTopicList] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)
  const { topicID } = useParams<'topicID'>()
  const [searchParams] = useSearchParams()

  const [retry, setRetry] = useState(false)
  // const [abort, setAbort] = useState(false)

  const topicIDNumber = parseInt(topicID)

  const topicName = searchParams.get('name') ?? '未知主题名'

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      const config = await readConfig()

      setConfig(config)

      // 没有配置 api key
      if (!config || config.openApiKey === '') {
        setOpenSetting(true)
      }

      void appWindow.once(TauriEvent.WINDOW_CLOSE_REQUESTED, async () => {
        await invoke('restore_is_on_top')
        await appWindow.close()
      })
    }

    void fetchConfig()
  }, [])

  useLayoutEffect(() => {
    void getMessagesByTopic(topicID)
  }, [topicID])

  const getMessagesByTopic = useCallback(
    async (topicID: string): Promise<void> => {
      try {
        const conversations = await invoke<Conversation[]>(
          'get_messages_by_topic_id',
          { topicId: topicIDNumber }
        )

        console.log('当前消息', messages)
        console.log('会话', conversations)

        if (topicID === '2' && conversations.length > 0) {
          await showConfirm(topicID)
        }

        const ms = conversationsToMessages(conversations)

        setMessages(ms)
      } catch (e) {
        void message.error((e as any).toString())
      }
    },
    [topicID]
  )

  const showConfirm = async (topicID: string): Promise<void> => {
    confirm({
      title: '注意',
      icon: <ExclamationCircleFilled />,
      content:
        '在完善新的问题之前应先清空之前的对话，否则会影响新问题的对话逻辑。',
      okText: '继续',
      cancelText: '清空',
      cancelButtonProps: { danger: true, type: 'primary' },
      onOk() {
        console.log('do nothing')
      },
      async onCancel() {
        console.log('清空主题', topicID)

        try {
          await invoke('clear_topic', { topicId: topicIDNumber })

          setMessages([])
        } catch (e) {
          void message.error(e as string)
        }
      },
    })
  }

  const handleAbortStream = async (): Promise<void> => {
    await appWindow.emit('abort-stream')
    void message.info('已中断流式响应')
  }

  const newMessage = (content: string): number => {
    const createdAt = now()

    setMessages((prevMessages) => [
      ...prevMessages,
      { content, role: 'user', time: createdAt },
    ])

    return createdAt
  }

  const sendStreamRequest = async (args: ChatRequestArgs): Promise<void> => {
    console.log('使用的代理配置', config?.proxy)

    try {
      const unlisten = await appWindow.listen<string>('stream', async (e) => {
        await handleStreamResponse(e, setMessages)
      })

      try {
        const messageID = await invoke<number>('chat_gpt_stream', args as any)

        if (messageID === 0) {
          setMessages((pre) => [...pre.slice(0, pre.length - 2)])
        }
      } catch (e) {
        void message.error(e as string)

        setRetry(true)

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, prevMessages.length - 1),
        ])
      }

      unlisten()
    } catch (e) {
      void message.error(e as string)

      setRetry(true)

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - 1),
      ])
    }
  }

  const sendRequest = async (args: ChatRequestArgs): Promise<void> => {
    const resp = await invoke<ChatGPTResponse<Choice>>('chat_gpt', args as any)

    // chatgpt 的响应的时间戳是精确到秒的，需要 x1000 js 才能正确识别
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: addNewLine(resp.choices[0].message.content),
        role: resp.choices[0].message.role,
        time: resp.created * 1000,
      },
    ])
  }

  const createConfigProperties = (): Omit<
    ChatRequestArgs,
    'request' | 'createdAt'
  > => ({
    proxyConfig: {
      ...config?.proxy,
      reverse_proxy: config?.proxy?.reverseProxy,
    },
    apiKey: config?.openApiKey,
    topicId: topicIDNumber,
  })

  const handleSendMessage = useCallback(
    async (content: string, stream = true): Promise<void> => {
      const createdAt = newMessage(content)

      setWaiting(true)
      setRetry(false)

      const sendedMessages: ChatMessage[] = [
        {
          role: 'user',
          content,
        },
      ]

      fillMessages(
        sendedMessages,
        messages,
        config?.topics?.[topicID],
        topicIDNumber === 2 ? config?.prompt?.inChinese : undefined
      )

      console.log('要发送的消息', sendedMessages)

      try {
        const args = {
          ...createConfigProperties(),
          request: newChatRequest(
            sendedMessages,
            stream,
            topicIDNumber <= 2
              ? 1.0
              : config?.topics?.[topicID].temperature ?? 1.0
          ),
          createdAt,
        }

        console.log('要发送的参数', args)

        if (stream) await sendStreamRequest(args)
        else await sendRequest(args)
      } catch (e) {
        setRetry(true)
        setWaiting(false)

        console.error(e)

        await message.error(e as any)
      } finally {
        setWaiting(false)
      }
    },
    [config, messages, topicID]
  )

  const handleConfigChange = (newConfig: Config): void => {
    setConfig(newConfig)
    setOpenSetting(false)

    console.log('新配置', newConfig)

    if (isEqual(config, newConfig)) return

    void saveConfig(newConfig)
  }

  const closeSettings = (): void => {
    setOpenSetting(false)
  }

  const removeLastMessages = useCallback(
    (n: number): void => {
      console.log(messages)
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - n),
      ])
    },
    [messages]
  )

  const handleRedo = async (): Promise<boolean> => {
    const res = await deleteMessage(messages[messages.length - 2].time)

    if (!res) return false

    res && removeLastMessages(2)

    setRetry(false)

    return true
  }

  if (config == null) {
    return (
      <Spin tip="正在读取配置文件">
        <div className="content" />
      </Spin>
    )
  }

  const handleOnTop = (): void => {
    void invoke('switch_top_status', { current: config.isOnTop })

    const newConfig = { ...config, isOnTop: !config.isOnTop }

    setConfig(newConfig)

    void saveConfig(newConfig)
  }

  return (
    <>
      <React.Suspense fallback={null}>
        <GlobalFloatButtons
          config={config}
          handleOnTop={handleOnTop}
          setOpenSetting={setOpenSetting}
          setShowTopicList={setShowTopicList}
        />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <GlobalSettings
          config={config}
          open={openSetting}
          closeSettings={closeSettings}
          onConfigChange={handleConfigChange}
        />
      </React.Suspense>

      <Layout className="layout">
        {showTopicList ? (
          <Sider>
            <React.Suspense fallback={null}>
              <Menu
                selectedID={topicID ?? '1'}
                config={config}
                onConfigChange={setConfig}
              />
            </React.Suspense>
          </Sider>
        ) : null}

        <Content>
          <React.Suspense fallback={null}>
            <Chat
              key={topicID}
              topicName={topicName}
              messages={messages}
              config={config}
              showTopicList={showTopicList}
            />
          </React.Suspense>

          <React.Suspense fallback={null}>
            <MessageInput
              onSendMessage={handleSendMessage}
              onAbortStream={handleAbortStream}
              resetMessageList={() => {
                setMessages([])
              }}
              redo={handleRedo}
              waiting={waiting}
              config={config}
              topicID={topicID}
              retry={retry}
              lastUserMessage={
                messages.length >= 2
                  ? messages[messages.length - 2].content
                  : ''
              }
            />
          </React.Suspense>
        </Content>
      </Layout>
    </>
  )
}

export default ChatPage
