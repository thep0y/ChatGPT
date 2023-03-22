import React, { useState } from 'react'
import { Layout } from 'antd'
import Chat from '~/components/Chat'
import { invoke } from '@tauri-apps/api'
import { now } from '~/lib'

const { Header, Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])

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
      const resp = await invoke<ChatGPTResponse>('chat_gpt', { text: message, model: '' })

      setMessages((prevMessages) => [
        ...prevMessages,
        resp.choices[0].message
      ])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Layout>
      <Header>ChatGPT</Header>

      <Content>
        <Chat messages={messages} onSendMessage={handleSendMessage} />
      </Content>
    </Layout>
  )
}

export default ChatPage
