/* eslint-disable react/prop-types */
import React, { useState, memo } from 'react'
import { LoadingOutlined, SendOutlined } from '@ant-design/icons'
import { Affix, Button, Input, Space } from 'antd'
import { addNewLine } from '~/lib'

const MessageInput: React.FC<MessageInputProps> = memo(
  ({ onSendMessage, waiting, config }) => {
    const [message, setMessage] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      setMessage(e.target.value)
    }

    const handleEnter = (): void => {
      if (message.trim() !== '') {
        onSendMessage(addNewLine(message), config.useStream)
        setMessage('')
      }
    }

    return (
      <div id="input-message">
        <Affix style={{ width: '90%', maxWidth: 800 }}>
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
)

MessageInput.displayName = 'MessageInput'

export default MessageInput
