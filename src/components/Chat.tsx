/* eslint-disable react/prop-types */
import React, { useState, memo, lazy } from 'react'
import { Input, Affix, Button, Space } from 'antd'
import { SendOutlined, LoadingOutlined } from '@ant-design/icons'
import '~/styles/ChatBubble.scss'

const Message = lazy(async () => await import('~/components/Message'))

interface MessageListProps {
  messages: Message[]
}

const MessageList: React.FC<MessageListProps> = memo(({
  messages
}) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <React.Suspense fallback={null} key={time}>
        <Message
          content={content}
          role={role}
          time={time}
        />
      </React.Suspense>
    ))}
  </ol>
))

MessageList.displayName = 'MessageList'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  waiting: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage, waiting
}) => {
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value)
  }

  const handleEnter = (): void => {
    if (message.trim() !== '') {
      onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <div>
      <Affix offsetBottom={10}>
        <Space.Compact block>
          <Input
            value={message}
            placeholder="输入你要发送给 ChatGPT 的消息"
            onChange={handleChange}
            onPressEnter={handleEnter}
          />

          <Button type='primary' onClick={handleEnter} disabled={waiting || message.trim() === ''}>
            {
             waiting
               ? <LoadingOutlined />
               : <SendOutlined />
            }
          </Button>
        </Space.Compact>
      </Affix>
    </div>
  )
}

type ChatProps = MessageListProps & MessageInputProps

const Chat: React.FC<ChatProps> = memo(({ messages, onSendMessage, waiting }: ChatProps) => (
  <div>
    <MessageList messages={messages} />
    <MessageInput onSendMessage={onSendMessage} waiting={waiting} />
  </div>
))

Chat.displayName = 'Chat'

export default Chat
