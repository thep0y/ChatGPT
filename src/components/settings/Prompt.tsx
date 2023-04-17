import React, { memo, useState } from 'react'
import { Modal, Form, Switch } from 'antd'

const Settings: React.FC<PromptSettingsProps> = memo(({
  open, closeSettings, onSettingsChange, config
}: PromptSettingsProps) => {
  const [inChinese, setInChinese] = useState(config?.inChinese ?? true)

  const onSwitchLanguage = (status: boolean): void => {
    setInChinese(status)
  }

  const onCancel = (): void => {
    closeSettings?.()
  }

  const onOk = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onSettingsChange?.({
      inChinese
    })
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
          tooltip="默认使用中文作为提示/问题完善文字，关闭时使用英文。应根据实际情况设置。"
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
