import React, { useState, memo, useCallback, useEffect } from 'react'
import {
  LoadingOutlined,
  SendOutlined,
  CloseCircleFilled, ClearOutlined
} from '@ant-design/icons'
import {
  Affix,
  Button,
  type ButtonProps,
  Input,
  Space,
  Tooltip,
  message
} from 'antd'
import { invoke } from '@tauri-apps/api'

const { TextArea } = Input

const MessageInput = memo(({
  onSendMessage,
  onAbortStream,
  resetMessageList,
  waiting,
  config,
  topicID,
  retryContent
}: MessageInputProps) => {
  const [chatMessage, setChatMessage] = useState(retryContent)

  useEffect(() => {
    setChatMessage(retryContent)
  }, [retryContent])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    // TODO: 双击回车发送消息，不能对所有的消息都 trim 处理
    // 回车发送后可能会添加一个新的换行，需要 trim 一下
    setChatMessage(e.target.value.trim())
  }, [])

  const handleEnter = useCallback((): void => {
    const message = chatMessage.trim()

    if (message === '') {
      setChatMessage(message)

      return
    }

    void onSendMessage(message, config.useStream)
    setChatMessage('')
  }, [chatMessage, config.useStream, onSendMessage])

  const clearMessages = async (): Promise<void> => {
    console.log('清空主题', topicID)

    try {
      await invoke('clear_topic', { topicId: parseInt(topicID) })

      resetMessageList()
    } catch (e) {
      void message.error((e as string))
    }
  }

  const handleAbort = (): void => {
    onAbortStream(chatMessage)
  }

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
      onClick: waiting ? handleAbort : handleEnter
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
          <Tooltip title='清空当前主题消息'>
            <Button type='primary' disabled={waiting} onClick={clearMessages}>
              <ClearOutlined />
            </Button>
          </Tooltip>

          <TextArea
            value={chatMessage}
            placeholder="输入你要发送给 ChatGPT 的消息"
            onChange={handleChange}
            onPressEnter={handleEnter}
            maxLength={4000}
            autoSize={{ minRows: 1, maxRows: 10 }}
            style={{ borderRadius: 0 }}
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
