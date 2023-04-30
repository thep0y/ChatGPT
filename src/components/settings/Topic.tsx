import React, { type ChangeEvent, memo, useCallback, useReducer } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Button, Popconfirm, message, Row, Col, Slider } from 'antd'
import { invoke } from '@tauri-apps/api'

const { TextArea } = Input

const CONVERSATION_MIN_COUNT = 1
const CONVERSATION_MAX_COUNT = 5

const TOPIC_NAME_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 200
const PROMPT_MAX_LENGTH = 500

const TEMPERATURE_MIN = 0
const TEMPERATURE_MAX = 2
const TEMPERATURE_STEP = 0.01

interface SettingsState {
  topicName: string
  description: string
  useContext: boolean
  conversationCount: number
  useFirstConversation: boolean
  systemRole: string
  systemRoleAvailable: boolean
  temperature: number
}

type SettingsAction =
  | { type: 'SET_TOPIC_NAME', payload: string }
  | { type: 'SET_TOPIC_DESCRIPTION', payload: string }
  | { type: 'SET_USE_CONTEXT', payload: boolean }
  | { type: 'SET_CONVERSATION_COUNT', payload: number }
  | { type: 'SET_USE_FIRST_CONVERSATION', payload: boolean }
  | { type: 'SET_SYSTEM_ROLE', payload: string }
  | { type: 'SET_SYSTEM_ROLE_AVAILABLE', payload: boolean }
  | { type: 'SET_TEMPERATURE', payload: number }

const reducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case 'SET_TOPIC_NAME':
      return { ...state, topicName: action.payload }
    case 'SET_TOPIC_DESCRIPTION':
      return { ...state, description: action.payload }
    case 'SET_USE_CONTEXT':
      return { ...state, useContext: action.payload }
    case 'SET_CONVERSATION_COUNT':
      return { ...state, conversationCount: action.payload }
    case 'SET_USE_FIRST_CONVERSATION':
      return { ...state, useFirstConversation: action.payload }
    case 'SET_SYSTEM_ROLE':
      return { ...state, systemRole: action.payload }
    case 'SET_SYSTEM_ROLE_AVAILABLE':
      return { ...state, systemRoleAvailable: action.payload }
    case 'SET_TEMPERATURE':
      return { ...state, temperature: action.payload }
  }
}

const Settings: React.FC<TopicSettingsProps> = ({
  topicID,
  config,
  open,
  name,
  description,
  onSettingsChange,
  closeSettings,
  onDeleteMenuItem
}) => {
  if (config === undefined && topicID === undefined) {
    return null
  }

  const [state, dispatch] = useReducer(reducer, {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    topicName: name!,
    description: description ?? '',
    useContext: config?.use_context ?? true,
    conversationCount: config?.conversation_count ?? 1,
    useFirstConversation: config?.use_first_conversation ?? false,
    systemRole: config?.system_role ?? '',
    systemRoleAvailable: !!config?.system_role,
    temperature: config?.temperature ?? 1.0
  })

  const onCancel = useCallback(() => {
    closeSettings?.()
  }, [closeSettings])

  const onDelete = useCallback(async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = parseInt(topicID!)

    await invoke('delete_topic', { topicId: id })
    onDeleteMenuItem?.(id)
    closeSettings?.()
  }, [topicID, onDeleteMenuItem, closeSettings])

  const updateTopic = async (): Promise<void> => {
    if (name === state.topicName && description === state.description) return

    await invoke('update_topic', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      topidId: parseInt(topicID!),
      newName: state.topicName,
      newDescription: state.description
    })
  }

  const onOk = (): void => {
    void updateTopic()

    console.log('系统角色', state.systemRole)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onSettingsChange?.(topicID!, {
      use_context: state.useContext,
      conversation_count: state.conversationCount,
      use_first_conversation: state.useFirstConversation,
      system_role: state.systemRole,
      temperature: state.temperature
    })
    closeSettings?.()
  }

  const onUseContextChange = useCallback((status: boolean): void => {
    dispatch({ type: 'SET_USE_CONTEXT', payload: status })
  }, [])

  const onConversationCountChange = useCallback(
    (newValue: number | null): void => {
      newValue && dispatch({ type: 'SET_CONVERSATION_COUNT', payload: newValue })
    },
    []
  )

  const setSystemRoleAvailable = useCallback((status: boolean): void => {
    if (!status) dispatch({ type: 'SET_SYSTEM_ROLE', payload: '' })

    dispatch({ type: 'SET_SYSTEM_ROLE_AVAILABLE', payload: status })
  }, [])

  const onUseFirstConversationChange = useCallback((status: boolean): void => {
    dispatch({ type: 'SET_USE_FIRST_CONVERSATION', payload: status })
  }, [])

  const onTemperatureChange = useCallback((value: number | null): void => {
    if (typeof value !== 'number') {
      return
    }

    dispatch({ type: 'SET_TEMPERATURE', payload: value })
  }, [])

  const onSystemRoleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    dispatch({ type: 'SET_SYSTEM_ROLE', payload: e.currentTarget.value })
  }, [])

  const onTopicNameChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    dispatch({ type: 'SET_TOPIC_NAME', payload: e.currentTarget.value })
  }, [])

  const onTopicDescriptionChange = useCallback((
    e: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    dispatch({ type: 'SET_TOPIC_DESCRIPTION', payload: e.currentTarget.value })
  }, [])

  const onCancelDelete = useCallback((): void => {
    void message.info('下次注意点，别乱点按钮！')
  }, [])

  const desc = (
    <div>
      <p>
        这将删除此主题及其所属的全部消息，
      </p>

      <p>
        这是一个不可恢复的操作。
      </p>
    </div>
  )

  const footer = [
    <Popconfirm
      key='delete'
      title='确认删除此主题吗？'
      description={desc}
      onCancel={onCancelDelete}
      onConfirm={onDelete}
      okText="确定"
      cancelText="取消"
    >
      <Button
        type="primary"
        danger
      >
        删除
      </Button>
    </Popconfirm>,
    <Button
      key="cancel"
      onClick={onCancel}
    >
      取消
    </Button>,
    <Button
      key="submit"
      type="primary"
      onClick={onOk}
    >
      保存
    </Button>
  ]

  return (
    <Modal
      title="主题设置"
      okText="保存"
      cancelText="取消"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      footer={footer}
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
            maxLength={TOPIC_NAME_MAX_LENGTH}
            showCount
            onChange={onTopicNameChange}
          />
        </Form.Item>

        <Form.Item label="主题描述">
          <TextArea
            defaultValue={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={onTopicDescriptionChange}
            showCount
            autoSize
          />
        </Form.Item>

        <Form.Item name="temperature" label="分布参数" tooltip='值越大，ChatGPT的回复越随机，值越小，回复越精确。为 0 值将对同样的问题回复相同的内容，为 2 时回复可能会很抽象。默认值为 1，应根据实际情况自行调整。'>
          <Row>
            <Col span={16}>
              <Slider
                min={TEMPERATURE_MIN}
                max={TEMPERATURE_MAX}
                value={typeof state.temperature === 'number' ? state.temperature : 0}
                step={TEMPERATURE_STEP}
                onChange={onTemperatureChange}
              />
            </Col>

            <Col span={2}>
              <InputNumber
                min={TEMPERATURE_MIN}
                max={TEMPERATURE_MAX}
                value={state.temperature}
                step={TEMPERATURE_STEP}
                style={{ margin: '0 16px' }}
                onChange={onTemperatureChange}
              />
            </Col>
          </Row>
        </Form.Item>

        <Form.Item name="use-role" label="使用角色设定">
          <Switch
            defaultChecked={state.systemRoleAvailable}
            onChange={(v) => {
              setSystemRoleAvailable(v)
            }}
          />
        </Form.Item>

        {state.systemRoleAvailable
          ? (
            <Form.Item label="系统角色">
              <TextArea
                showCount
                maxLength={PROMPT_MAX_LENGTH}
                autoSize
                rows={2}
                value={state.systemRole}
                onChange={onSystemRoleChange}
                placeholder="输入为此对话中的 ChatGPT 设定的角色语句"
              />
            </Form.Item>
            )
          : null}

        <Form.Item name="use-context" label="是否使用上下文">
          <Switch
            defaultChecked={state.useContext}
            onChange={onUseContextChange}
          />
        </Form.Item>

        {state.useContext
          ? (
            <>
              <Form.Item label="上下文数量">
                <InputNumber
                  min={CONVERSATION_MIN_COUNT}
                  max={CONVERSATION_MAX_COUNT}
                  defaultValue={state.conversationCount}
                  onChange={onConversationCountChange}
                />
              </Form.Item>

              <Form.Item name="use-first-conversation" label="使用第一组对话">
                <Switch
                  defaultChecked={state.useFirstConversation}
                  onChange={onUseFirstConversationChange}
                />
              </Form.Item>
            </>
            )
          : null}
      </Form>
    </Modal>
  )
}

export default memo(Settings)
