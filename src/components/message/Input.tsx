/* eslint-disable react/prop-types */
import React, { useState, memo } from 'react'
import {
  LoadingOutlined,
  SendOutlined,
  CloseCircleFilled
} from '@ant-design/icons'
import { Affix, Button, type ButtonProps, Input, Space, Tooltip, message } from 'antd'
import { addNewLine } from '~/lib'
import { appWindow } from '@tauri-apps/api/window'

const MessageInput: React.FC<MessageInputProps> = memo(
  ({ onSendMessage, waiting, config }) => {
    const [chatMessage, setChatMessage] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      setChatMessage(e.target.value)
    }

    const handleEnter = (): void => {
      if (chatMessage.trim() !== '') {
        onSendMessage(addNewLine(chatMessage), config.useStream)
        setChatMessage('')
      }
    }

    const handleAbortStream = async (): Promise<void> => {
      await appWindow.emit('abort-stream')
      void message.info('已中断流式响应')

      // TODO: 添加重试按钮快捷发送上一个问题。
    }

    const statusButton = (): React.ReactNode => {
      const disabled = waiting || chatMessage.trim() === ''
      const icon = waiting ? config.useStream ? <CloseCircleFilled /> : <LoadingOutlined /> : <SendOutlined />
      const commonBtnProps: ButtonProps = {
        type: 'primary',
        onClick: handleEnter,
        disabled: config.useStream ? (waiting ? false : disabled) : disabled,
        danger: waiting
      }
      const streamBtnProps: ButtonProps = {
        ...commonBtnProps,
        onClick: waiting ? handleAbortStream : handleEnter
      }

      return (
        (config.useStream && waiting)
          ? (
            <Tooltip title="中断流式响应">
              <Button {...streamBtnProps}>{icon}</Button>
            </Tooltip>
            )
          : (
            <Button {...commonBtnProps}>{icon}</Button>
            )
      )
    }

    return (
      <div id="input-message">
        <Affix style={{ width: '90%', maxWidth: 800 }}>
          <Space.Compact block>
            <Input
              value={chatMessage}
              placeholder="输入你要发送给 ChatGPT 的消息"
              onChange={handleChange}
              onPressEnter={handleEnter}
            />

            {statusButton()}
          </Space.Compact>
        </Affix>
      </div>
    )
  }
)

MessageInput.displayName = 'MessageInput'

export default MessageInput