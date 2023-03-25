import React, { useState } from 'react'
import { Form, Input, Modal, Select, Slider, Row, Col, InputNumber, Switch } from 'antd'

type Protocol = 'http' | 'https' | 'socks5' | 'socks5h'

interface Proxy {
  protocol?: Protocol
  host?: string
  port?: number
}

interface SettingsForm {
  proxy: Proxy
  openApiKey: string
  imageScale: number
  useContext: boolean
}

interface CollectionCreateFormProps {
  open: boolean
  onCreate: (settings: SettingsForm) => void
  onCancel: () => void
}

const Settings: React.FC<CollectionCreateFormProps> = ({
  open,
  onCreate,
  onCancel
}) => {
  const [form] = Form.useForm()

  // TODO: 此处默认值应从配置文件中读取
  const [proxy, setProxy] = useState<Proxy>({})
  const [openApiKey, setOpenApiKey] = useState('')
  const [imageScale, setImageScale] = useState(4)
  const [useContext, setUseContext] = useState(false)

  const onSelectProtocol = (protocol: Protocol): void => {
    setProxy(pre => {
      pre.protocol = protocol

      return pre
    })
  }

  const onInputHost = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setProxy(pre => {
      pre.host = e.target.value

      return pre
    })
  }

  const onInputPort = (port: number): void => {
    setProxy(pre => {
      pre.port = port

      return pre
    })
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
          .then((values) => {
            form.resetFields()
            onCreate(values)
          })
          .catch((info) => {
            console.log('Validate Failed:', info)
          })
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ modifier: 'public' }}
      >
        <Form.Item
          name="proxy"
          label="代理"
          rules={[{ required: true, message: '请输入有效的代理地址！' }]}
        >
          <Row>
            <Col span={5}>
              <Select
                placeholder="选择协议"
                optionFilterProp="children"
                onChange={onSelectProtocol}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
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
            </Col>

            <Col span={12}>
              <Input placeholder='HOST' onChange={onInputHost} />
            </Col>

            <Col span={4}>
              <InputNumber
                min={1}
                max={65535}
                placeholder='PORT'
                onChange={onInputPort}
              />
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="open-api-key"
          label="OPEN API KEY"
          rules={[{ required: true, message: '请输入 OPEN API KEY！' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="image-scale"
          label="导入图片的缩放比例"
        >
          <Row>
            <Col span={12}>
              <Slider
                min={2}
                max={8}
                onChange={onImageScaleChange}
                value={typeof imageScale === 'number' ? imageScale : 0}
              />
            </Col>

            <Col span={4}>
              <InputNumber
                min={2}
                max={8}
                style={{ margin: '0 16px' }}
                value={imageScale}
                onChange={onImageScaleChange}
              />
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="modifier"
          label="是否使用上下文"
          className="collection-create-form_last-form-item"
        >
          <Switch defaultChecked={useContext} onChange={onUseContextChange} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Settings
