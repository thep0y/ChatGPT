/* eslint-disable react/prop-types */
import React, { useState, memo, lazy, useRef } from 'react'
import { Input, Affix, Button, Space, FloatButton } from 'antd'
import {
  SendOutlined,
  LoadingOutlined,
  SaveOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import domtoimage from 'dom-to-image-more'

import '~/styles/Chat.scss'
import { addNewLine } from '~/lib'

const Message = lazy(async () => await import('~/components/Message'))

interface MessageListProps {
  messages: Message[]
}

const MessageList: React.FC<MessageListProps> = memo(({ messages }) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <React.Suspense fallback={null} key={time}>
        <Message content={content} role={role} time={time} />
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
  onSendMessage,
  waiting
}) => {
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMessage(e.target.value)
  }

  const handleEnter = (): void => {
    if (message.trim() !== '') {
      onSendMessage(addNewLine(message))
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

          <Button
            type="primary"
            onClick={handleEnter}
            disabled={waiting || message.trim() === ''}
          >
            {waiting ? <LoadingOutlined /> : <SendOutlined />}
          </Button>
        </Space.Compact>
      </Affix>
    </div>
  )
}

type ChatProps = MessageListProps & MessageInputProps

const Chat: React.FC<ChatProps> = memo(
  ({ messages, onSendMessage, waiting }: ChatProps) => {
    const messageListComponentRef = useRef<HTMLDivElement>(null)

    const handleSaveImage = async (): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const target = messageListComponentRef.current!

      const lis: NodeListOf<HTMLElement> = target.querySelectorAll('li.shared')

      for (const li of lis) {
        li.classList.add('export')
      }

      domtoimage.toBlob(target, { scale: 4 }).then(blob => {
        const link = document.createElement('a')

        link.download = 'my-component.png'
        link.href = URL.createObjectURL(blob)
        link.click()

        for (const li of lis) {
          li.classList.remove('export')
        }
      })
    }

    return (
      <div id='chat'>
        <div ref={messageListComponentRef}>
          <MessageList messages={messages} />
        </div>

        <MessageInput onSendMessage={onSendMessage} waiting={waiting} />

        <FloatButton.Group
          trigger="hover"
          style={{ right: 8 }}
          icon={<SaveOutlined />}
        >
          <FloatButton tooltip="保存为 txt" icon={<FileTextOutlined />} />
          <FloatButton tooltip="保存为 pdf" icon={<FilePdfOutlined />} />

          <FloatButton
            tooltip="保存为 markdown"
            icon={<FileMarkdownOutlined />}
          />

          <FloatButton onClick={handleSaveImage} tooltip="保存为图片" icon={<FileImageOutlined />} />
        </FloatButton.Group>
      </div>
    )
  }
)

Chat.displayName = 'Chat'
export default Chat
