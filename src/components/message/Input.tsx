import React, { useState, memo, useCallback } from 'react'
import {
  LoadingOutlined,
  SendOutlined,
  CloseCircleFilled
} from '@ant-design/icons'
import {
  Affix,
  Button,
  type ButtonProps,
  Input,
  Space,
  Tooltip
} from 'antd'

const { TextArea } = Input

const MessageInput = memo(({
  onSendMessage,
  onAbortStream,
  waiting,
  config
}: MessageInputProps) => {
  const [chatMessage, setChatMessage] = useState('')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    // 回车发送后可能会添加一个新的换行，需要 trim 一下
    setChatMessage(e.target.value.trim())
  }, [])

  const handleEnter = useCallback((): void => {
    if (chatMessage.trim() === '') {
      setChatMessage('')

      return
    }

    void onSendMessage(chatMessage.trim(), config.useStream)
    setChatMessage('')
  }, [chatMessage, config.useStream, onSendMessage])

  const statusButton = (): React.ReactNode => {
    const disabled = waiting || chatMessage.trim() === ''
    const icon = waiting
      ? (
          config.useStream
            ? (
              <CloseCircleFilled />
              )
            : (
              <LoadingOutlined />
              )
        )
      : (
        <SendOutlined />
        )
    const commonBtnProps: ButtonProps = {
      type: 'primary',
      onClick: handleEnter,
      disabled: config.useStream ? (waiting ? false : disabled) : disabled,
      danger: waiting
    }
    const streamBtnProps: ButtonProps = {
      ...commonBtnProps,
      onClick: waiting ? onAbortStream : handleEnter
    }

    return config.useStream && waiting
      ? (
        <Tooltip title="中断流式响应">
          <Button {...streamBtnProps}>{icon}</Button>
        </Tooltip>
        )
      : (
        <Button {...commonBtnProps}>{icon}</Button>
        )
  }

  return (
    <div id="input-message">
      <Affix style={{ width: '90%', maxWidth: 800 }}>
        <Space.Compact block>
          <TextArea
            value={chatMessage}
            placeholder="输入你要发送给 ChatGPT 的消息"
            onChange={handleChange}
            onPressEnter={handleEnter}
            maxLength={2500}
            autoSize={{ minRows: 1, maxRows: 10 }}
            showCount
          />

          {statusButton()}
        </Space.Compact>
      </Affix>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'

export default memo(MessageInput)
