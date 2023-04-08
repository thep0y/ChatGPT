import { Modal } from 'antd'
import React, { memo } from 'react'

const Settings: React.FC<TopicSettingsProps> = ({ topicID, open, closeSettings }) => {
  const onCancel = (): void => {
    closeSettings?.()
  }
  const onOk = (): void => {
    closeSettings?.()
  }

  if (topicID == null) {
    return null
  }

  console.log('主题 ID', topicID)

  return (
    <Modal
      title='主题设置'
      okText="保存"
      cancelText="取消"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
    />
  )
}

export default memo(Settings)
