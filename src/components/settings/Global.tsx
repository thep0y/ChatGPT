import React, { useCallback, useMemo, useReducer, useEffect, memo } from 'react'
import {
  Form,
  Input,
  Modal,
  Select,
  Slider,
  Row,
  Col,
  InputNumber,
  Switch,
  Divider,
  Tooltip,
  Button,
  message,
} from 'antd'
import { UserMessageMode } from '~/lib/fs'
import { SwapOutlined } from '@ant-design/icons'
import { invoke } from '@tauri-apps/api'
import { Models } from '~/lib'

const PROTOCOLS: Array<SelectOption<string>> = [
  {
    value: 'http://',
    label: 'http',
  },
  {
    value: 'https://',
    label: 'https',
  },
  {
    value: 'socks5://',
    label: 'socks5',
  },
  {
    value: 'socks5h://',
    label: 'socks5h',
  },
]

const MARKDOWN_USER_MESSAGE_MODES: Array<SelectOption<number>> = [
  {
    value: UserMessageMode.TITLE,
    label: '二级标题',
  },
  {
    value: UserMessageMode.QUOTE,
    label: '引用块',
  },
]

const IMAGE_SCALE_MIN = 2
const IMAGE_SCALE_MAX = 8

const PORT_MIN = 1
const PORT_MAX = 65535

interface SettingsProps {
  config: Config
  open: boolean
  onConfigChange: (settings: Config) => void
  closeSettings: () => void
}

interface SelectOption<T = string | number> {
  readonly value: T
  readonly label: string
}

interface SettingsState {
  proxyMethod: ProxyMethod
  proxy: Proxy
  reverseProxy: string
  openApiKey: string
  imageScale: number
  useStream: boolean
  useEnter: boolean
  showLineNumbers: boolean
  export: ExportConfig
}

type SettingsAction =
  | { type: 'SET_PROXY_METHOD'; payload: ProxyMethod }
  | { type: 'SET_PROXY'; payload: Proxy }
  | { type: 'SET_REVERSE_PROXY'; payload: string }
  | { type: 'SET_OPEN_API_KEY'; payload: string }
  | { type: 'SET_IMAGE_SCALE'; payload: number }
  | { type: 'SET_USE_STREAM'; payload: boolean }
  | { type: 'SET_USE_ENTER'; payload: boolean }
  | { type: 'SET_SHOW_LINE_NUMBERS'; payload: boolean }
  | { type: 'SET_MARKDOWN_USER_MESSAGE_MODE'; payload: UserMessageMode }
  | { type: 'RESET'; payload: SettingsState }

const initialState: SettingsState = {
  proxyMethod: 'proxy',
  proxy: {},
  reverseProxy: '',
  openApiKey: '',
  imageScale: 4,
  useStream: true,
  useEnter: false,
  showLineNumbers: false,
  export: {
    markdown: {
      mode: UserMessageMode.TITLE,
    },
  },
}

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case 'SET_PROXY_METHOD':
      return { ...state, proxyMethod: action.payload }
    case 'SET_PROXY':
      return {
        ...state,
        proxy: action.payload,
      }
    case 'SET_REVERSE_PROXY':
      return { ...state, reverseProxy: action.payload }
    case 'SET_OPEN_API_KEY':
      return { ...state, openApiKey: action.payload }
    case 'SET_IMAGE_SCALE':
      return { ...state, imageScale: action.payload }
    case 'SET_USE_STREAM':
      return { ...state, useStream: action.payload }
    case 'SET_USE_ENTER':
      return { ...state, useEnter: action.payload }
    case 'SET_SHOW_LINE_NUMBERS':
      return { ...state, showLineNumbers: action.payload }
    case 'SET_MARKDOWN_USER_MESSAGE_MODE':
      return {
        ...state,
        export: {
          markdown: {
            mode: action.payload,
          },
        },
      }
    case 'RESET':
      return state
  }
}

const Settings = memo(
  ({ config, open, onConfigChange, closeSettings }: SettingsProps) => {
    const [form] = Form.useForm()

    const [state, dispatch] = useReducer(settingsReducer, initialState)

    useEffect(() => {
      dispatch({
        type: 'SET_PROXY_METHOD',
        payload: config.proxy?.method ?? 'proxy',
      })
      dispatch({ type: 'SET_PROXY', payload: { ...config.proxy?.proxy } })
      dispatch({
        type: 'SET_REVERSE_PROXY',
        payload: config.proxy?.reverseProxy ?? '',
      })
      dispatch({ type: 'SET_OPEN_API_KEY', payload: config.openApiKey })
      dispatch({ type: 'SET_IMAGE_SCALE', payload: config.imageScale })
      dispatch({
        type: 'SET_MARKDOWN_USER_MESSAGE_MODE',
        payload: config.export.markdown.mode,
      })
      dispatch({ type: 'SET_USE_STREAM', payload: config.useStream })
      dispatch({ type: 'SET_USE_ENTER', payload: config.useEnter })
      dispatch({
        type: 'SET_SHOW_LINE_NUMBERS',
        payload: config.showLineNumbers,
      })
    }, [config])

    const onProxyMethodChange = useCallback(
      (value: ProxyMethod): void => {
        dispatch({ type: 'SET_PROXY_METHOD', payload: value })
      },
      [state]
    )

    const onMarkdownUserMessageModeChange = useCallback(
      (value: UserMessageMode): void => {
        dispatch({ type: 'SET_MARKDOWN_USER_MESSAGE_MODE', payload: value })
      },
      []
    )

    const onProxyInputChange = useCallback(
      (key: keyof Proxy, value: string | number): void => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dispatch({
          type: 'SET_PROXY',
          payload: { ...state.proxy, [key]: value },
        })
      },
      [state.proxy]
    )

    const onReverseProxyInputChange = useCallback((value: string): void => {
      dispatch({ type: 'SET_REVERSE_PROXY', payload: value })
    }, [])

    const onInputOpenApiKey = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        dispatch({ type: 'SET_OPEN_API_KEY', payload: e.target.value })
      },
      []
    )

    const onImageScaleChange = useCallback((newValue: number | null): void => {
      if (newValue != null) {
        dispatch({ type: 'SET_IMAGE_SCALE', payload: newValue })
      }
    }, [])

    const onUseStreamChange = useCallback((status: boolean): void => {
      dispatch({ type: 'SET_USE_STREAM', payload: status })
    }, [])

    const onUseEnterChange = useCallback((status: boolean): void => {
      dispatch({ type: 'SET_USE_ENTER', payload: status })
      console.log(state)
    }, [])

    const onShowLineNumbersChange = useCallback((status: boolean): void => {
      dispatch({ type: 'SET_SHOW_LINE_NUMBERS', payload: status })
      console.log(state)
    }, [])

    const resetSettings = useCallback((): void => {
      dispatch({
        type: 'RESET',
        payload: initialState,
      })
    }, [])

    const {
      proxyMethod,
      proxy,
      reverseProxy,
      openApiKey,
      imageScale,
      useStream,
      useEnter,
      showLineNumbers,
      export: {
        markdown: { mode },
      },
    } = state

    const onFinish = useCallback(async (): Promise<void> => {
      try {
        await form.validateFields()

        const newSettings: Config = {
          ...config,
          proxy: {
            method: proxyMethod,
            reverseProxy,
            proxy: Object.keys(proxy).length === 0 ? undefined : proxy,
          },
          imageScale,
          openApiKey,
          useStream,
          useEnter,
          showLineNumbers,
          export: {
            markdown: {
              mode,
            },
          },
        }

        console.log('新配置文件', newSettings)
        onConfigChange(newSettings)
      } catch (info) {
        console.log('Validate Failed:', info)
      }
    }, [state])

    const protocolOptions = useMemo(
      () =>
        PROTOCOLS.map((protocol) => (
          <Select.Option key={protocol.value} value={protocol.value}>
            {protocol.label}
          </Select.Option>
        )),
      []
    )

    const markdownUserMessageModeOptions = useMemo(
      () =>
        MARKDOWN_USER_MESSAGE_MODES.map((mode) => (
          <Select.Option key={mode.value} value={mode.value}>
            {mode.label}
          </Select.Option>
        )),
      []
    )

    const onCancel = (): void => {
      form.resetFields()

      resetSettings()

      closeSettings()
    }

    const onCheckConnect = async (): Promise<void> => {
      try {
        const res = await invoke<Model>('get_model', {
          proxyConfig: {
            ...config?.proxy,
            reverse_proxy: config?.proxy?.reverseProxy,
          },
          apiKey: config?.openApiKey,
          model: Models.GPT_3_5,
        })

        if (res.id) void message.success('代理有效')
      } catch (e) {
        void message.error('无法访问 api，可能是因为代理无效或网络异常')
      }
    }

    return (
      <Modal
        open={open}
        title="设置"
        okText="保存"
        cancelText="取消"
        onCancel={onCancel}
        onOk={onFinish}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          name="settings"
          colon={false}
          initialValues={{ 'open-api-key': openApiKey }}
        >
          <Divider>基础设置</Divider>

          <Form.Item
            name="proxy"
            label="代理"
            wrapperCol={{ span: 21 }}
            labelCol={{ span: 3 }}
            initialValue={config.proxy}
          >
            <Input.Group compact>
              <Select
                placeholder="选择代理方式"
                value={proxyMethod}
                onChange={(value) => {
                  onProxyMethodChange(value)
                }}
              >
                <Select.Option key="reverse-proxy" value="reverse-proxy">
                  反向代理
                </Select.Option>

                <Select.Option key="proxy" value="proxy">
                  代理
                </Select.Option>
              </Select>

              {proxyMethod == null ? null : proxyMethod === 'proxy' ? (
                <>
                  <Form.Item
                    name={['proxy', 'protocol']}
                    initialValue={proxy.protocol}
                    noStyle
                    rules={[{ required: true, message: '请选择代理协议！' }]}
                  >
                    <Select
                      style={{ width: 91 }}
                      value={proxy.protocol}
                      placeholder="选择协议"
                      optionFilterProp="children"
                      onChange={(value) => {
                        onProxyInputChange('protocol', value)
                      }}
                    >
                      {protocolOptions}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name={['proxy', 'host']}
                    initialValue={proxy.host}
                    noStyle
                    rules={[{ required: true, message: '请输入代理地址！' }]}
                  >
                    <Input
                      placeholder="HOST"
                      value={proxy.host}
                      style={{ width: 130 }}
                      onChange={(e) => {
                        onProxyInputChange('host', e.target.value)
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name={['proxy', 'port']}
                    noStyle
                    initialValue={proxy.port}
                    rules={[{ required: true, message: '请输入代理端口！' }]}
                  >
                    <InputNumber
                      min={PORT_MIN}
                      max={PORT_MAX}
                      value={proxy.port}
                      style={{ width: 70 }}
                      placeholder="PORT"
                      onChange={(value) => {
                        onProxyInputChange('port', value ?? 1)
                      }}
                    />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  name="reverse-proxy"
                  initialValue={config.proxy?.reverseProxy}
                  noStyle
                  rules={[{ required: true, message: '请输入反向代理地址！' }]}
                >
                  <Input
                    placeholder="REVERSE PROXY"
                    style={{ width: 260 }}
                    onChange={(e) => {
                      onReverseProxyInputChange(e.target.value)
                    }}
                  />
                </Form.Item>
              )}

              <Tooltip title="检测连通性。设置好代理后应点击此按钮检查连通性，避免在使用过程中出现网络错误">
                <Button
                  shape="circle"
                  onClick={onCheckConnect}
                  icon={<SwapOutlined rotate={90} />}
                />
              </Tooltip>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="open-api-key"
            label="OPEN API KEY"
            rules={[{ required: true, message: '请输入 OPEN API KEY！' }]}
          >
            <Input.Password onChange={onInputOpenApiKey} />
          </Form.Item>

          <Form.Item
            name="image-scale"
            label="图片缩放比例"
            tooltip="导出图片的缩放比例"
          >
            <Row>
              <Col span={12}>
                <Slider
                  value={imageScale}
                  min={IMAGE_SCALE_MIN}
                  max={IMAGE_SCALE_MAX}
                  onChange={onImageScaleChange}
                />
              </Col>

              <Col span={4}>
                <InputNumber
                  value={imageScale}
                  min={IMAGE_SCALE_MIN}
                  max={IMAGE_SCALE_MAX}
                  style={{ margin: '0 16px' }}
                  onChange={onImageScaleChange}
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            name="use-stream"
            label="流式响应"
            tooltip="是否使用流式响应"
          >
            <Switch checked={useStream} onChange={onUseStreamChange} />
          </Form.Item>

          <Form.Item
            name="use-enter"
            label="回车发送消息"
            tooltip="是否使用回车键发送消息，开启后需通过shift+enter完成换行"
          >
            <Switch checked={useEnter} onChange={onUseEnterChange} />
          </Form.Item>

          <Form.Item
            name="show-line-numbers"
            label="显示行号"
            tooltip="代码块中是否显示行号，开启后在选择并复制文字时也会复制行号"
          >
            <Switch
              checked={showLineNumbers}
              onChange={onShowLineNumbersChange}
            />
          </Form.Item>

          <Divider>导出</Divider>

          <Form.Item
            name="markdown-save-mode"
            label="用户消息样式"
            initialValue={mode}
            tooltip="Markdown 用户消息保存形式，用户消息是多行文本时，应使用引用块形式保存"
          >
            <Select
              style={{ width: 150 }}
              placeholder="选择保存形式"
              optionFilterProp="children"
              onChange={(value) => {
                onMarkdownUserMessageModeChange(value)
              }}
            >
              {markdownUserMessageModeOptions}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    )
  }
)

Settings.displayName = 'GlobalSettings'

export default Settings
