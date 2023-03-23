import React, { useState, memo } from 'react'
import { Input, Button } from 'antd'
import ReactMarkdown from 'react-markdown'
import '~/styles/ChatBubble.scss'

interface ChatProps {
  messages: Message[]
  onSendMessage: (message: string) => void
}

const MessageList: React.FC<Omit<ChatProps, 'onSendMessage'>> = ({ messages }) => (
  <ol className='list'>
    {messages.map(({ content, role, time }, i) => {
      const sent = role === 'user'

      return (
        <li
          key={time}
          className={`shared ${(sent ?? false) ? 'sent' : 'received'}`}
        >
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </li>
      )
    })}
  </ol>
)

// const MessageList: React.FC<Omit<ChatProps, 'onSendMessage'>> = ({ messages }) => (
//   <List
//     dataSource={messages}
//     renderItem={(item) => (
//       <List.Item>
//         <ChatBubble message={item.content} role={item.role} time={formatTime(item.time)} />
//       </List.Item>
//     )}
//   />
// )

const MessageInput: React.FC<Omit<ChatProps, 'messages'>> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value)
  }

  const handleClick = (): void => {
    onSendMessage(message)
    setMessage('')
  }

  return (
    <div>
      <Input value={message} onChange={handleChange} />
      <Button onClick={handleClick}>发送</Button>
    </div>
  )
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }: ChatProps) => (
  <div>
    <MessageList messages={messages} />
    <MessageInput onSendMessage={onSendMessage} />
  </div>
)

export default memo(Chat)
