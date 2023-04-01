import React, { useEffect, useState } from 'react'
import { type MenuProps, Spin, Menu, Button, message } from 'antd'
import {
  PlusOutlined,
  OrderedListOutlined,
  MessageOutlined
} from '@ant-design/icons'
import '~/styles/Menu.scss'
import { invoke } from '@tauri-apps/api'
import { type MenuItemGroupType } from 'antd/es/menu/hooks/useItems'

type MenuItem = Required<MenuProps>['items'][number]

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem => {
  return {
    key,
    icon,
    children,
    label,
    type
  } satisfies MenuItem
}

const getTopics = (topics: MenuItem[]): MenuItem[] => {
  return [
    getItem(
      <Button>
        <PlusOutlined />
        新主题
      </Button>,
      'grp',
      <OrderedListOutlined />,
      topics,
      'group'
    )
  ]
}

const ChatMenu: React.FC = () => {
  const [topics, setTopics] = useState<MenuItem[]>(getTopics([]))
  const [freeKey, setFreeKey] = useState('')

  useEffect(() => {
    const fetchTopics = async (): Promise<void> => {
      try {
        const topics = await invoke<Topic[]>('get_topics')

        setTopics(
          getTopics(
            topics.map((t) => {
              if (t.name === '自由对话') {
                setFreeKey(t.id.toString())
              }

              return getItem(t.name, t.id, <MessageOutlined />)
            })
          )
        )
      } catch (e) {
        void message.error((e as any).toString())
      }
    }

    void fetchTopics()
  }, [])

  if (!(topics[0] as MenuItemGroupType)?.children?.length) {
    return (
      <Spin tip="正在获取主题列表">
        <div className="content" />
      </Spin>
    )
  }

  return (
    <Menu
      className="topic-list"
      mode="inline"
      items={topics}
      onSelect={(e) => { console.log('选择主题', e) }}
      onClick={(e) => { console.log('点击主题', e) }}
      defaultSelectedKeys={[freeKey]}
    />
  )
}

export default ChatMenu
