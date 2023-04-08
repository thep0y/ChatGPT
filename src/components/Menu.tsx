import React, { lazy, useCallback, useEffect, useState } from 'react'
import { type MenuProps, Spin, Menu, Button, message, Input } from 'antd'
import {
  PlusOutlined,
  MessageOutlined,
  SettingFilled
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { invoke } from '@tauri-apps/api'
import '~/styles/Menu.scss'
import { isEqual, now, saveConfig } from '~/lib'

const TopicSettings = lazy(
  async () => await import('~/components/settings/Topic')
)

type MenuItem = Required<MenuProps>['items'][number]

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  onClick?: MenuProps['onClick'],
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem => {
  return {
    key,
    icon,
    children,
    label,
    type,
    onClick,
    style: { paddingLeft: 10, paddingRight: 10 }
  } satisfies MenuItem
}

interface ChatMenuProps {
  selectedID: string
  config: Config
  onConfigChange: (config: Config) => void
}

const newTopic = (
  label: React.ReactNode,
  key: React.Key,
  onClick?: MenuProps['onClick']
): MenuItem => {
  return getItem(label, key, onClick, <MessageOutlined />)
}

const defaultOpenSettings: TopicSettingsProps = { open: false }
const defaultTopicConfig: TopicConfig = {
  use_context: true,
  conversation_count: 1,
  use_first_conversation: false,
  system_role: ''
}

// TODO: 功能比较简单，为了使用自定义滚动条应重写此组件
const ChatMenu: React.FC<ChatMenuProps> = ({
  selectedID,
  config,
  onConfigChange: setConfig
}) => {
  const [topics, setTopics] = useState<MenuItem[]>([])
  const [openSettings, setOpenSettings] = useState<TopicSettingsProps>({
    ...defaultOpenSettings
  })
  const navigate = useNavigate()

  const onEscape = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.code === 'Escape') {
        setTopics((pre) => [...pre.slice(0, pre.length - 1)])
      }
    },
    [topics]
  )

  const onConfirm = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>): Promise<void> => {
      const topicName = e.currentTarget.value
      const createdAt = now()

      const id = await invoke<number>('new_topic', {
        name: topicName,
        createdAt
      })

      const newTopicLabel = (
        <span>
          <Link to={'/' + id.toString()}>{topicName}</Link>

          <Button>
            <SettingFilled />
          </Button>
        </span>
      )
      const topic = newTopic(newTopicLabel, id, () => {
        navigate('/' + id.toString())
      })

      setTopics((pre) => [...pre.slice(0, pre.length - 1), topic])

      navigate('/' + id.toString())
    },
    [topics]
  )

  const onNewTopic = useCallback((): void => {
    const inputTopicName = (
      <Input
        placeholder="输入新主题名"
        bordered={false}
        onPressEnter={onConfirm}
        onKeyUp={onEscape}
        autoFocus
      />
    )

    const t = newTopic(
      inputTopicName,
      parseInt(topics[topics.length - 1]?.key as string) + 1
    )

    setTopics((pre) => [...pre, t])
  }, [topics])

  const handleConfigChange = (
    topicID: string,
    topicConfig: TopicConfig
  ): void => {
    const newConfig = {
      ...config,
      topics: {
        [topicID]: topicConfig
      }
    }

    setConfig(newConfig)
    setOpenSettings({ open: false })

    if (isEqual(config, newConfig)) return

    void saveConfig(newConfig)
  }

  const closeSettings = (): void => {
    setOpenSettings({ open: false })
  }

  const openTopicSettings = (
    e: React.MouseEvent,
    t: Topic,
    config: Config
  ): void => {
    e.stopPropagation()

    setOpenSettings({
      open: true,
      topicID: t.id.toString(),
      name: t.name,
      config: config.topics ? config.topics[t.id] : { ...defaultTopicConfig },
      onSettingsChange: handleConfigChange,
      closeSettings
    })
  }

  useEffect(() => {
    const fetchTopics = async (): Promise<void> => {
      try {
        const topics = await invoke<Topic[]>('get_topics')

        setTopics(
          topics.map((t) => {
            const label = <Link to={'/' + t.id.toString()}>{t.name}</Link>

            return getItem(
              label,
              t.id,
              () => {
                navigate('/' + t.id.toString())
              },
              <Button
                className="topic-settings"
                shape="circle"
                onClick={(e) => {
                  openTopicSettings(e, t, config)
                }}
                style={{ zIndex: 99 }}
                disabled={t.id === 1}
                icon={<SettingFilled />}
              />
            )
          })
        )
      } catch (e) {
        void message.error((e as any).toString())
      }
    }

    void fetchTopics()
  }, [config, navigate])

  if (!topics.length) {
    return (
      <Spin tip="正在获取主题列表">
        <div className="content" />
      </Spin>
    )
  }

  return (
    <>
      {/* TODO: TopicSettings 的渲染时间需要优化，不该在加载 menu 时渲染 */}
      <TopicSettings {...openSettings} />

      <Menu
        style={{ overflowY: 'scroll' }}
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
        defaultSelectedKeys={[selectedID]}
      />
    </>
  )
}

export default ChatMenu
