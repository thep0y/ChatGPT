import React, { useState } from 'react'
import {
  Form,
  Input,
  Modal,
  Select,
  Slider,
  Row,
  Col,
  InputNumber,
  Switch
} from 'antd'

interface SettingsProps {
  config: Config
  open: boolean
  // onCreate: (settings: SettingsForm) => void
  onCancel: () => void
  onConfigChange: (settings: Config) => void
}

const Settings: React.FC<SettingsProps> = ({
  config,
  open,
  // onCreate,
  onCancel,
  onConfigChange
}) => {
  const [form] = Form.useForm()

  // TODO: 此处默认值应从配置文件中读取
  const [proxy, setProxy] = useState<Proxy>({ ...config.proxy })
  const [openApiKey, setOpenApiKey] = useState(config.openApiKey)
  const [imageScale, setImageScale] = useState(config.imageScale)
  const [useContext, setUseContext] = useState(config.useContext)

  const onSelectProtocol = (protocol: Protocol): void => {
    setProxy((pre) => {
      pre.protocol = protocol

      return pre
    })
  }

  const onInputHost = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setProxy((pre) => {
      pre.host = e.target.value

      return pre
    })
  }

  const onInputPort = (port: number | null): void => {
    if (port == null) return

    setProxy((pre) => {
      pre.port = port

      return pre
    })
  }

  const onInputOpenApiKey = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setOpenApiKey(e.target.value)
  }

  const onImageScaleChange = (newValue: number | null): void => {
    if (newValue == null) {
      return
    }

    setImageScale(newValue)
  }

  const onUseContextChange = (status: boolean): void => {
    setUseContext(status)
  }

  return (
    <Modal
      open={open}
      title="设置"
      okText="保存"
      cancelText="取消"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then(() => {
            form.resetFields()

            const newSettings: Config = {
              proxy: { ...proxy },
              imageScale,
              useContext,
              openApiKey
            }

            console.log(newSettings)

            onConfigChange(newSettings)
          })
          .catch((info) => {
            console.log('Validate Failed:', info)
          })
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="settings"
        initialValues={{ 'open-api-key': openApiKey }}
      >
        <Form.Item name="proxy" label="代理" initialValue={proxy}>
          <Input.Group compact>
            <Form.Item
              name={['proxy', 'protocol']}
              noStyle
              rules={[{ required: true, message: '请选择代理协议！' }]}
            >
              <Select
                value={proxy.protocol}
                placeholder="选择协议"
                optionFilterProp="children"
                onChange={onSelectProtocol}
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())}
                options={[
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
                ]}
              />
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
                style={{ width: 250 }}
                onChange={onInputHost}
              />
            </Form.Item>

            <Form.Item
              name={['proxy', 'port']}
              noStyle
              rules={[{ required: true, message: '请输入代理端口！' }]}
            >
              <InputNumber
                min={1}
                max={65535}
                value={proxy.port}
                placeholder="PORT"
                onChange={onInputPort}
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

        <Form.Item name="image-scale" label="导入图片的缩放比例">
          <Row>
            <Col span={12}>
              <Slider
                value={imageScale}
                min={2}
                max={8}
                onChange={onImageScaleChange}
              />
            </Col>

            <Col span={4}>
              <InputNumber
                value={imageScale}
                min={2}
                max={8}
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
          <Switch checked={useContext} onChange={onUseContextChange} disabled />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Settings
