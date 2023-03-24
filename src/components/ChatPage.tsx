import React, { useState, lazy, useEffect, useRef, useCallback } from 'react'
import { Layout } from 'antd'
import { invoke } from '@tauri-apps/api'
import { now } from '~/lib'
import '~/styles/ChatPage.scss'
import { addNewLine } from '~/lib/message'

const Chat = lazy(async () => await import('~/components/Chat'))

const { Header, Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(
    JSON.parse(import.meta.env.VITE_MESSAGES)
  )
  const [waiting, setWaiting] = useState<boolean>(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current != null) {
      bottomRef.current.scrollIntoView({
        behavior: 'smooth'
      })
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

  return (
    <Layout>
      <Header className="chat-title">
        <h2> 这是对话标题 </h2>
      </Header>

      <Content>
        <React.Suspense fallback={null}>
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            waiting={waiting}
          />
        </React.Suspense>

        <div ref={bottomRef} />
      </Content>
    </Layout>
  )
}

export default ChatPage
