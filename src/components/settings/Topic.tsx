import React, { type ChangeEvent, memo, useCallback, useState } from 'react'
import { Modal, Form, Input, InputNumber, Switch } from 'antd'
import { invoke } from '@tauri-apps/api'

const { TextArea } = Input

const CONVERSATION_MIN_COUNT = 1
const CONVERSATION_MAX_COUNT = 5

const Settings: React.FC<TopicSettingsProps> = ({
  topicID,
  config,
  open,
  name,
  onSettingsChange,
  closeSettings
}) => {
  if (config === undefined && topicID === undefined) {
    return null
  }

  const [topicName, setTopicName] = useState(name)
  const [useContext, setUseContext] = useState(config?.use_context ?? true)
  const [conversationCount, setConversationCount] = useState(config?.conversation_count ?? 1)
  const [useFirstConversation, setUseFirstConversation] = useState(config?.use_first_conversation ?? false)

  const [systemRole, setSystemRole] = useState(config?.system_role ?? '')
  const [systemRoleAvailable, setSystemRoleAvailable] = useState(!!config?.system_role)

  const onCancel = (): void => {
    closeSettings?.()
  }

  const onOk = (): void => {
    if (name !== topicName) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      void invoke('update_topic', { topidId: parseInt(topicID!), newName: topicName })
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onSettingsChange?.(topicID!, {
      use_context: useContext,
      conversation_count: conversationCount,
      use_first_conversation: useFirstConversation,
      system_role: systemRole
    })
    closeSettings?.()
  }

  const onUseContextChange = useCallback((status: boolean): void => {
    setUseContext(status)
  }, [])

  const onConversationCountChange = useCallback(
    (newValue: number | null): void => {
      if (newValue != null) setConversationCount(newValue)
    },
    []
  )

  const onUseFirstConversationChange = useCallback((status: boolean): void => {
    setUseFirstConversation(status)
  }, [])

  const onSystemRoleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setSystemRole(e.currentTarget.value)
  }

  const onTopicNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTopicName(e.currentTarget.value)
  }

  return (
    <Modal
      title="主题设置"
      okText="保存"
      cancelText="取消"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
      >
        <Form.Item label="主题名">
          <Input
            defaultValue={name}
            maxLength={20}
            showCount
            onChange={onTopicNameChange}
          />
        </Form.Item>

        <Form.Item
          name="use-context"
          label="是否使用上下文"
        >
          <Switch defaultChecked={useContext} onChange={onUseContextChange} />
        </Form.Item>

        {useContext
          ? (
            <>
              <Form.Item label="上下文数量">
                <InputNumber
                  min={CONVERSATION_MIN_COUNT}
                  max={CONVERSATION_MAX_COUNT}
                  defaultValue={conversationCount}
                  onChange={onConversationCountChange}
                />
              </Form.Item>

              <Form.Item
                name="use-first-conversation"
                label="使用第一组对话"
              >
                <Switch
                  defaultChecked={useFirstConversation}
                  onChange={onUseFirstConversationChange}
                />
              </Form.Item>

              <Form.Item
                name="use-role"
                label="使用角色设定"
              >
                <Switch defaultChecked={systemRoleAvailable} onChange={(v) => { setSystemRoleAvailable(v) }} />
              </Form.Item>

              {systemRoleAvailable
                ? (
                  <Form.Item label="系统角色">
                    <TextArea
                      showCount
                      maxLength={40}
                      autoSize
                      rows={2}
                      defaultValue={systemRole}
                      onChange={onSystemRoleChange}
                      placeholder='输入为此对话中的 ChatGPT 设定的角色语句'
                    />
                  </Form.Item>
                  )
                : null}
            </>
            )
          : null}
      </Form>
    </Modal>
  )
}

export default memo(Settings)
