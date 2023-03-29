import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Menu, Button } from 'antd'
import { PlusOutlined, SettingOutlined, OrderedListOutlined, MessageOutlined } from '@ant-design/icons'

type MenuItem = Required<MenuProps>['items'][number]

const getItem = (label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'): MenuItem => {
  return {
    key,
    icon,
    children,
    label,
    type
  } satisfies MenuItem
}

const defaultMenuItems: MenuProps['items'] = [
  getItem((<Button>
    <PlusOutlined />
    新主题
  </Button>), 'grp', <OrderedListOutlined />, [
    getItem('自由对话', '1', <MessageOutlined />),
    getItem('Option 13', '2', <MessageOutlined />),
    getItem('Option 14', '3', <MessageOutlined />)
  ], 'group'),
  { type: 'divider' },
  getItem('设置', 'sub4', <SettingOutlined />, undefined)
]

const ChatMenu: React.FC = () => {
  const [items, setItems] = useState<MenuProps['items']>(defaultMenuItems)

  //   setItems([getItem('Group', 'grp', null, [getItem('Option 13', '13'), getItem('Option 14', '14')], 'group')])

  //   useEffect(() => {

  //   })

  return (
    <Menu
      mode="inline"
      items={items}
    />
  )
}

export default ChatMenu
