import React, { useState, memo, useRef, useCallback, lazy, useLayoutEffect } from 'react'
import { FloatButton, message } from 'antd'
import {
  SaveOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import domtoimage from 'dom-to-image-more'
import {
  type SaveDialogOptions,
  save,
  type DialogFilter
} from '@tauri-apps/api/dialog'

import '~/styles/Chat.scss'
import { saveFile, saveMarkdown } from '~/lib/fs'
import Progress from '~/components/Progress'
import { now } from '~/lib'

const MessageList = lazy(async () => await import('~/components/message/List'))
const Scrollbar = lazy(
  async () => await import('~/components/scrollbar/Scrollbar')
)

type ChatProps = MessageListProps & { config: Config, topicName: string }

const IMAGE_FILTER_OPTION: SaveDialogOptions = {
  filters: [
    {
      name: '图片',
      extensions: ['png', 'svg', 'jpeg']
    }
  ] as DialogFilter[]
} as const

const MARKDOWN_FILTER_OPTION: SaveDialogOptions = {
  filters: [
    {
      name: 'markdown',
      extensions: ['md']
    }
  ] as DialogFilter[]
} as const

const handleSaveError = (
  errorMsg: string,
  setSaving: React.Dispatch<React.SetStateAction<Saving>>
): void => {
  void message.error(errorMsg)
  setSaving((pre) => ({ status: false, name: pre.name }))
}

interface ExportTask {
  filepath: string
  blob: Blob | null
}

const toMarkdown = async (topicName: string, setSaving: React.Dispatch<React.SetStateAction<Saving>>): Promise<string | null> => {
  const filePath = await save({
    ...MARKDOWN_FILTER_OPTION,
    defaultPath: `${topicName}-${now()}.md`
  })

  if (filePath === null) {
    handleSaveError('markdown 的保存路径选择失败', setSaving)

    return null
  }

  return filePath
}

const toImage = async (
  topicName: string,
  messageListComponentRef: React.RefObject<HTMLDivElement>,
  setSaving: React.Dispatch<React.SetStateAction<Saving>>,
  imageScale: number
): Promise<ExportTask | null> => {
  const filePath = await save({
    ...IMAGE_FILTER_OPTION,
    defaultPath: `${topicName}-${now()}.png`
  })

  if (filePath === null) {
    handleSaveError('图片的保存路径选择失败', setSaving)

    return null
  }

  const target = messageListComponentRef.current

  if (target == null) {
    handleSaveError('当前消息列表为空', setSaving)

    return null
  }

  setSaving({ status: true, name: '图片' })

  const lis: NodeListOf<HTMLElement> = target.querySelectorAll('li.shared')

  lis.forEach((li) => {
    li.classList.add('export')
  })

  try {
    const blob = await domtoimage.toBlob(target, { scale: imageScale })

    lis.forEach((li) => {
      li.classList.remove('export')
    })

    return { blob, filepath: filePath }
  } catch (e) {
    console.error(e)
    handleSaveError((e as any).toString(), setSaving)

    return null
  }
}

const Chat = memo(({ messages, config, showTopicList, topicName }: ChatProps) => {
  const messageListComponentRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState<Saving>({ status: false, name: '' })
  const [progress, setProgress] = useState(0)
  const [key, setKey] = useState(0)

  const handleSaveMarkdown = useCallback(async () => {
    if (messages.length === 0) {
      await message.warning('当前消息列表为空')
    }

    const path = await toMarkdown(topicName, setSaving)

    if (path == null) {
      return
    }

    await saveMarkdown(path, topicName, messages, setProgress)

    void message.success('markdown 已保存到：' + path)
  }, [messageListComponentRef, messages, setSaving, setProgress, config])

  const handleSaveImage = useCallback(async () => {
    // TODO: 在其他主题中，保存图片有 bug
    if (messages.length === 0) {
      await message.warning('当前消息列表为空')

      return
    }

    const res = await toImage(
      topicName,
      messageListComponentRef,
      setSaving,
      config.imageScale
    )

    if (res == null) {
      return
    }

    const { blob, filepath } = res

    if (blob == null) {
      setSaving((pre) => ({ status: false, name: pre.name }))
      void message.error('对话过长，图片尺寸过大，请更换导出类型')

      return
    }

    try {
      const buffer = new Uint8Array(await blob.arrayBuffer())

      await saveFile(filepath, buffer, setProgress)

      void message.success('图片已保存到：' + filepath)
    } catch (e) {
      handleSaveError((e as any).toString(), setSaving)
    } finally {
      setProgress(0)
      setSaving((pre) => ({ status: false, name: pre.name }))
    }
  }, [messageListComponentRef, messages, setSaving, setProgress, config])

  const observer = new ResizeObserver(entries => {
    // Chat 组件高度变化时需要让 messageListComponentRef 也产生变化
    // 才能让滚动条的高度更新，这里采用给 messageListComponentRef 添加
    // 一个变化的属性的办法
    entries.forEach(entry => {
      setKey(pre => pre + 1)
      entry.target.setAttribute('key', key.toString())
    })
  })

  useLayoutEffect(() => {
    const current = messageListComponentRef.current

    if (!current) return

    observer.observe(messageListComponentRef.current)
  }, [messageListComponentRef.current])

  return (
    <>
      {saving.status ? <Progress progress={progress} /> : null}

      <Scrollbar>
        <div id="chat">
          <div ref={messageListComponentRef}>
            <React.Suspense fallback={null}>
              <MessageList messages={messages} showTopicList={showTopicList} />
            </React.Suspense>
          </div>

        </div>
      </Scrollbar>

      <FloatButton.Group
        trigger="hover"
        style={{ right: 8, bottom: 160 }}
        icon={<SaveOutlined />}
      >
        <FloatButton
          key="save-txt"
          tooltip="保存为 txt"
          icon={<FileTextOutlined />}
        />

        <FloatButton
          key="save-pdf"
          tooltip="保存为 pdf"
          icon={<FilePdfOutlined />}
        />

        <FloatButton
          key="save-markdown"
          tooltip="保存为 markdown"
          onClick={handleSaveMarkdown}
          icon={<FileMarkdownOutlined />}
        />

        <FloatButton
          key="save-image"
          onClick={handleSaveImage}
          tooltip="保存为图片"
          icon={<FileImageOutlined />}
        />
      </FloatButton.Group>
    </>
  )
})

Chat.displayName = 'Chat'

export default Chat
