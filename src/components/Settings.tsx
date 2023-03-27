import React, { useState, useCallback, useMemo } from 'react'
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
  message
} from 'antd'

const PROTOCOLS: ProtocolOption[] = [
  {
    value: 'http://',
    label: 'http'
  },
  {
    value: 'https://',
    label: 'https'
  },
  {
    value: 'socks5://',
    label: 'socks5'
  },
  {
    value: 'socks5h://',
    label: 'socks5h'
  }
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

interface ProtocolOption {
  readonly value: string
  readonly label: string
}

const Settings: React.FC<SettingsProps> = ({
  config,
  open,
  onConfigChange,
  closeSettings
}) => {
  const [form] = Form.useForm()

  // TODO: 此处默认值应从配置文件中读取
  const [proxy, setProxy] = useState({ ...config.proxy })
  const [openApiKey, setOpenApiKey] = useState(config.openApiKey)
  const [imageScale, setImageScale] = useState(config.imageScale)
  const [useContext, setUseContext] = useState(config.useContext)

  const onProxyInputChange = useCallback((
    key: keyof Proxy,
    value: string | number
  ): void => {
    setProxy((pre) => {
      const nc = { ...pre, [key]: value }

      return nc
    })
  }, [])

  const onInputOpenApiKey = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setOpenApiKey(e.target.value)
  }, [])

  const onImageScaleChange = useCallback((newValue: number | null): void => {
    if (newValue != null) setImageScale(newValue)
  }, [])

  const onUseContextChange = useCallback((status: boolean): void => {
    void message.warning('当前暂未实现上下文功能')

    // setUseContext(status)
    setUseContext(false)
  }, [])

  const onFinish = useCallback(async (): Promise<void> => {
    try {
      await form.validateFields()
      form.resetFields()

      const newSettings: Config = { proxy, imageScale, useContext, openApiKey }

      onConfigChange(newSettings)
    } catch (info) {
      console.log('Validate Failed:', info)
    }
  }, [proxy, imageScale, useContext, openApiKey])

  const protocolOptions = useMemo(
    () =>
      PROTOCOLS.map(protocol => (
        <Select.Option key={protocol.value} value={protocol.value}>
          {protocol.label}
        </Select.Option>
      )),
    []
  )

  const onCancel = (): void => {
    form.resetFields()

    setProxy({ ...config.proxy })
    setOpenApiKey(config.openApiKey)
    setImageScale(config.imageScale)
    setUseContext(config.useContext)

    closeSettings()
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
        layout="vertical"
        name="settings"
        initialValues={{ 'open-api-key': openApiKey }}
      >
        <Form.Item name="proxy" label="代理" initialValue={config.proxy}>
          <Input.Group compact>
            <Form.Item
              name={['proxy', 'protocol']}
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
                style={{ width: 240 }}
                onChange={(e) => {
                  onProxyInputChange('host', e.target.value)
                }}
              />
            </Form.Item>

            <Form.Item
              name={['proxy', 'port']}
              noStyle
              rules={[{ required: true, message: '请输入代理端口！' }]}
            >
              <InputNumber
                min={PORT_MIN}
                max={PORT_MAX}
                value={proxy.port}
                placeholder="PORT"
                onChange={(value) => {
                  onProxyInputChange('port', value ?? 1)
                }}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>

        <Form.Item
          name="open-api-key"
          label="OPEN API KEY"
          rules={[{ required: true, message: '请输入 OPEN API KEY！' }]}
        >
          <Input.Password onChange={onInputOpenApiKey} />
        </Form.Item>

        <Form.Item name="image-scale" label="导出图片的缩放比例">
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
          name="use-context"
          label="是否使用上下文"
          className="collection-create-form_last-form-item"
        >
          <Switch
            checked={useContext}
            onChange={onUseContextChange}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Settings
