import { Modal } from 'antd'
import React, { memo } from 'react'

interface SettingsProps {
  topicID: number
  open: boolean
}

const Settings: React.FC<SettingsProps> = ({ topicID, open }) => {
  return (
    <Modal open={open} />
  )
}

export default memo(Settings)
