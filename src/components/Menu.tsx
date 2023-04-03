import React, { useCallback, useEffect, useState } from 'react'
import { type MenuProps, Spin, Menu, Button, message, Input } from 'antd'
import { PlusOutlined, MessageOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { invoke } from '@tauri-apps/api'
import '~/styles/Menu.scss'

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

interface ChatMenuProps {
  selectedID: string
}

const newTopic = (label: React.ReactNode, key: React.Key): MenuItem => {
  return getItem(label, key, <MessageOutlined />)
}

const ChatMenu: React.FC<ChatMenuProps> = ({ selectedID }) => {
  const [topics, setTopics] = useState<MenuItem[]>([])

  const onNewTopic = useCallback((): void => {
    console.log(topics)

    const inputTopicName = (
      <Input
        placeholder='输入新主题名'
        bordered={false}
        onPressEnter={(e) => {
          console.log(e.currentTarget.value)
        }}
        autoFocus
      />
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const t = newTopic(inputTopicName, parseInt(topics[topics.length - 1]!.key as string) + 1)

    setTopics(pre => [...pre, t])
  }, [topics])

  useEffect(() => {
    const fetchTopics = async (): Promise<void> => {
      try {
        const topics = await invoke<Topic[]>('get_topics')

        setTopics(
          topics.map((t) => {
            // if (t.name === '自由对话') {
            //   setFreeKey(t.id.toString())
            // }

            const a = <Link to={'/' + t.id.toString()}>{t.name}</Link>

            return getItem(a, t.id, <MessageOutlined />)
          })
        )
      } catch (e) {
        void message.error((e as any).toString())
      }
    }

    void fetchTopics()
  }, [])

  if (!topics.length) {
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
      items={[
        {
          key: 'grp',
          label: (
            <Button onClick={onNewTopic}>
              <PlusOutlined />
              新主题
            </Button>
          ),
          children: topics,
          type: 'group'
        }
      ]}
      onSelect={(e) => {
        console.log('选择主题', e)
      }}
      onClick={(e) => {
        console.log('点击主题', e)
      }}
      defaultSelectedKeys={[selectedID]}
    />
  )
}

export default ChatMenu
