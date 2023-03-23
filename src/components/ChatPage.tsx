import React, { useState, lazy } from 'react'
import { Layout } from 'antd'
import { invoke } from '@tauri-apps/api'
import { now } from '~/lib'
import '~/styles/ChatPage.scss'

const Chat = lazy(async () => await import('~/components/Chat'))

const { Header, Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(JSON.parse(import.meta.env.VITE_MESSAGES))

  // invoke('get_models').then(r => {
  //   console.log(r)
  // }).catch(e => {
  //   console.error(e)
  // })

  const handleSendMessage = async (message: string): Promise<void> => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: message, role: 'user', time: now() }
    ])
    // TODO: 使用 Tauri API 发送消息并接收 ChatGPT 的回复

    try {
      const resp = await invoke<ChatGPTResponse>('chat_gpt', {
        text: message,
        model: ''
      })

      setMessages((prevMessages) => [...prevMessages, { ...resp.choices[0].message, time: resp.created }])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Layout>
      <Header className="chat-title">
        <h2> 这是对话标题 </h2>
      </Header>

      <Content>
        <React.Suspense>
          <Chat messages={messages} onSendMessage={handleSendMessage} />
        </React.Suspense>
      </Content>
    </Layout>
  )
}

export default ChatPage
