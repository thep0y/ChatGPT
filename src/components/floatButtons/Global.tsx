import React, { memo } from 'react'
import { FloatButton } from 'antd'
import {
  SettingOutlined,
  PushpinFilled,
  PushpinOutlined,
  MenuOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

interface FloatButtonsProps {
  config: Config
  handleOnTop: () => void
  setOpenSetting: React.Dispatch<React.SetStateAction<boolean>>
  setShowTopicList: React.Dispatch<React.SetStateAction<boolean>>
}

const FloatButtons = memo(
  ({
    config,
    setOpenSetting,
    setShowTopicList,
    handleOnTop,
  }: FloatButtonsProps) => {
    return (
      <FloatButton.Group shape="circle" style={{ right: 8, bottom: 54 }}>
        <FloatButton
          icon={<SettingOutlined />}
          tooltip="设置"
          onClick={() => {
            setOpenSetting(true)
          }}
        />

        <FloatButton
          icon={config.isOnTop ? <PushpinFilled /> : <PushpinOutlined />}
          tooltip={config.isOnTop ? '取消置顶' : '置顶'}
          onClick={handleOnTop}
        />

        <FloatButton
          icon={<MenuOutlined />}
          tooltip="显示/隐藏主题列表"
          onClick={() => {
            setShowTopicList((pre) => !pre)
          }}
        />

        <FloatButton
          icon={<ReloadOutlined />}
          tooltip="刷新页面"
          onClick={() => {
            window.location.reload()
          }}
        />
      </FloatButton.Group>
    )
  }
)

FloatButtons.displayName = 'GlobalFloatButtons'

export default FloatButtons
