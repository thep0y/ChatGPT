import React, { useState, memo, useCallback, useEffect } from 'react'
import {
  LoadingOutlined,
  SendOutlined,
  CloseCircleFilled,
  ClearOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import {
  Affix,
  Button,
  type ButtonProps,
  Input,
  Space,
  Tooltip,
  message,
} from 'antd'
import { invoke } from '@tauri-apps/api'

const { TextArea } = Input

const MessageInput = memo(
  ({
    onSendMessage,
    onAbortStream,
    resetMessageList,
    redo,
    waiting,
    config,
    topicID,
    retry,
    lastUserMessage,
  }: MessageInputProps) => {
    const [chatMessage, setChatMessage] = useState('')
    const [lastInputMessage, setLastInputMessage] = useState(lastUserMessage)

    // console.log(lastUserMessage)

    useEffect(() => {
      setLastInputMessage(lastUserMessage)

      if (retry) {
        setChatMessage(lastUserMessage)
      }
    }, [lastUserMessage])

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setChatMessage(e.target.value)
      },
      [config.useEnter, chatMessage]
    )

    const handleEnter = useCallback(async (): Promise<void> => {
      const message = chatMessage.trim()

      if (message === '') {
        setChatMessage(message)

        return
      }

      void onSendMessage(message, config.useStream)

      setLastInputMessage(message)

      setChatMessage('')
    }, [chatMessage, config.useStream, onSendMessage])

    const clearMessages = async (): Promise<void> => {
      try {
        await invoke('clear_topic', { topicId: parseInt(topicID) })

        resetMessageList()
      } catch (e) {
        void message.error(e as string)
      }
    }

    const handleAbort = (): void => {
      onAbortStream()
      setChatMessage(lastInputMessage)
    }

    const handleRedo = async (): Promise<void> => {
      const ok = await redo()

      if (!ok) return

      void onSendMessage(lastInputMessage, config.useStream)
    }

    const statusButton = (): React.ReactNode => {
      const disabled = waiting || chatMessage.trim() === ''
      const icon = waiting ? (
        config.useStream ? (
          <CloseCircleFilled />
        ) : (
          <LoadingOutlined />
        )
      ) : (
        <SendOutlined />
      )
      const commonBtnProps: ButtonProps = {
        type: 'primary',
        onClick: handleEnter,
        disabled: config.useStream ? (waiting ? false : disabled) : disabled,
        danger: waiting,
      }
      const streamBtnProps: ButtonProps = {
        ...commonBtnProps,
        onClick: waiting ? handleAbort : handleEnter,
      }

      return config.useStream && waiting ? (
        <Tooltip title="中断流式响应">
          <Button {...streamBtnProps}>{icon}</Button>
        </Tooltip>
      ) : (
        <Button {...commonBtnProps}>{icon}</Button>
      )
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!config.useEnter) return

      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        setChatMessage((pre) => pre + '\n')

        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        void handleEnter()
      }
    }

    return (
      <div id="input-message">
        <Affix style={{ width: '90%', maxWidth: 800 }}>
          <Space.Compact block style={{ alignItems: 'end' }}>
            <Tooltip title="清空当前主题消息">
              <Button type="primary" disabled={waiting} onClick={clearMessages}>
                <ClearOutlined />
              </Button>
            </Tooltip>

            <TextArea
              value={chatMessage}
              placeholder={
                '输入你要发送给 ChatGPT 的消息' +
                (config.useEnter ? '，Shift + Enter 换行' : '')
              }
              onChange={handleChange}
              // onPressEnter={config.useEnter ? handleEnter : undefined}
              onKeyDown={handleKeyDown}
              maxLength={4000}
              autoSize={{ minRows: 1, maxRows: 10 }}
              style={{ borderRadius: 0 }}
              showCount
              allowClear
            />

            {statusButton()}

            {!waiting ?? lastInputMessage ? (
              <Tooltip title="重新发送最后的问题">
                <Button onClick={handleRedo}>
                  <RedoOutlined />
                </Button>
              </Tooltip>
            ) : null}
          </Space.Compact>
        </Affix>
      </div>
    )
  }
)

MessageInput.displayName = 'MessageInput'

export default memo(MessageInput)
