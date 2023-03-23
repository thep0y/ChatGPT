/* eslint-disable react/prop-types */
import React, { useState, memo, lazy } from 'react'
import { Input, Affix } from 'antd'
import '~/styles/ChatBubble.scss'

const Message = lazy(async () => await import('~/components/Message'))

interface ChatProps {
  messages: Message[]
  onSendMessage: (message: string) => void
}

const MessageList: React.FC<Omit<ChatProps, 'onSendMessage'>> = memo(({
  messages
}) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <React.Suspense key={time}>
        <Message
          content={content}
          role={role}
          time={0}
        />
      </React.Suspense>
    ))}
  </ol>
))

MessageList.displayName = 'MessageList'

const MessageInput: React.FC<Omit<ChatProps, 'messages'>> = ({
  onSendMessage
}) => {
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value)
  }

  const handleEnter = (): void => {
    onSendMessage(message)
    setMessage('')
  }

  return (
    <div>
      <Affix offsetBottom={10}>
        <Input value={message} onChange={handleChange} onPressEnter={handleEnter} />
      </Affix>
    </div>
  )
}

const Chat: React.FC<ChatProps> = memo(({ messages, onSendMessage }: ChatProps) => (
  <div>
    <MessageList messages={messages} />
    <MessageInput onSendMessage={onSendMessage} />
  </div>
))

Chat.displayName = 'Chat'

export default Chat
