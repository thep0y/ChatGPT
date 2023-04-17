import React, { memo, useState } from 'react'
import { Modal, Form, Switch } from 'antd'

const Settings: React.FC<PromptSettingsProps> = memo(({
  open, closeSettings, onSettingsChange
}: PromptSettingsProps) => {
  const [inChinese, setInChinese] = useState(false)

  const onSwitchLanguage = (status: boolean): void => {
    setInChinese(status)
  }

  const onCancel = (): void => {
    closeSettings?.()
  }

  const onOk = (): void => {
    // if (name !== state.topicName || description !== state.description) {
    //   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //   void invoke('update_topic', { topidId: parseInt(topicID!), newName: state.topicName, newDescription: state.description })
    // }

    // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // onSettingsChange?.(topicID!, {
    //   use_context: state.useContext,
    //   conversation_count: state.conversationCount,
    //   use_first_conversation: state.useFirstConversation,
    //   system_role: state.systemRole
    // })
    closeSettings?.()
  }

  return (
    <Modal
      open={open}
      title="提示设置"
      okText="保存"
      cancelText="取消"
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="switch-language"
          label="使用中文"
          tooltip="是否使用中文交流"
        >
          <Switch
            defaultChecked={inChinese}
            onChange={onSwitchLanguage}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})

Settings.displayName = 'PromptSettings'

export default Settings
