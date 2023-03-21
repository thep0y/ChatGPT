import React, { useState } from 'react'
import { Layout } from 'antd'
import Chat from '~/components/Chat'
import { invoke } from '@tauri-apps/api'
import { Model } from '~/lib'

const { Header, Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])

  invoke('get_models').then(r => {
    console.log(r)
  }).catch(e => {
    console.error(e)
  })

  const handleSendMessage = async (message: string): Promise<void> => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message, sender: 'user' }
    ])
    // TODO: 使用 Tauri API 发送消息并接收 ChatGPT 的回复

    try {
      const resp = await invoke('chat_gpt', { text: message, model: Model.GPT_3 })

      console.log(resp)
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
