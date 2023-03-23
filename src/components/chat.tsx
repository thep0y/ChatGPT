/* eslint-disable react/prop-types */
import React, { useState, memo } from 'react'
import { Input, Button } from 'antd'
import ReactMarkdown from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import '~/styles/ChatBubble.scss'

interface ChatProps {
  messages: Message[]
  onSendMessage: (message: string) => void
}

const Message: React.FC<Message> = memo(({ content, role, time }) => {
  const sent = role === 'user'

  const renderCodeBlock = ({
    node,
    inline,
    className,
    children,
    ...props
  }: CodeProps): React.ReactElement => {
    const match = /language-(\w+)/.exec(className ?? '')

    if (!(inline ?? false) && match != null) {
      return (
        <SyntaxHighlighter
          style={dark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <li className={`shared ${sent ? 'sent' : 'received'}`}>
      <ReactMarkdown components={{ code: renderCodeBlock }}>
        {content}
      </ReactMarkdown>
    </li>
  )
})

Message.displayName = 'Message'

const MessageList: React.FC<Omit<ChatProps, 'onSendMessage'>> = memo(({
  messages
}) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <Message
        key={time}
        content={content}
        role={role}
        time={0}
      />
    ))}
  </ol>
))

MessageList.displayName = 'MessageList'

// const MessageList: React.FC<Omit<ChatProps, 'onSendMessage'>> = ({ messages }) => (
//   <ol className='list'>
//     {messages.map(({ content, role, time }, i) => {
//       const sent = role === 'user'

//       return (
//         <li
//           key={time}
//           className={`shared ${(sent ?? false) ? 'sent' : 'received'}`}
//         >
//           <ReactMarkdown
//             components={{
//               code ({ node, inline, className, children, ...props }) {
//                 const match = /language-(\w+)/.exec(className ?? '')

//                 return !(inline ?? false) && (match != null)
//                   ? (
//                     <SyntaxHighlighter
//                       style={dark}
//                       language={match[1]}
//                       PreTag="div"
//                       {...props}
//                     >
//                       {String(children).replace(/\n$/, '')}
//                     </SyntaxHighlighter>
//                     )
//                   : (
//                     <code className={className} {...props}>
//                       {children}
//                     </code>
//                     )
//               }
//             }}
//           >
//             {content}
//           </ReactMarkdown>
//         </li>
//       )
//     })}
//   </ol>
// )

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

const MessageInput: React.FC<Omit<ChatProps, 'messages'>> = ({
  onSendMessage
}) => {
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

const Chat: React.FC<ChatProps> = memo(({ messages, onSendMessage }: ChatProps) => (
  <div>
    <MessageList messages={messages} />
    <MessageInput onSendMessage={onSendMessage} />
  </div>
))

Chat.displayName = 'Chat'

export default Chat
