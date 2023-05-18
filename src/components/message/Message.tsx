import React, { memo, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async'
import { dark as CodeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Button, Tooltip } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import 'katex/dist/katex.min.css'
import '~/styles/Message.scss'

interface CodeBlockProps extends CodeProps {
  time: number
  showLineNumbers: boolean
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className,
  showLineNumbers,
}) => {
  const [copied, setCopied] = useState(false)

  const match = useMemo(
    () => /language-(\w+)/.exec(className ?? ''),
    [className]
  )

  CodeStyle['code[class*="language-"]'].fontFamily = 'inherit'

  const onCopy = async (): Promise<void> => {
    setCopied(true)
  }

  const onBlur = (): void => {
    setCopied(false)
  }

  return (
    <div className="code-block">
      <CopyToClipboard text={String(children)}>
        <Tooltip title="复制" placement="left">
          <Button
            size="small"
            className="copy-button"
            onClick={onCopy}
            onMouseLeave={onBlur}
          >
            {copied ? <CheckOutlined /> : <CopyOutlined />}
          </Button>
        </Tooltip>
      </CopyToClipboard>

      <SyntaxHighlighter
        style={CodeStyle}
        customStyle={{ fontFamily: 'var(--user-monospace)' }}
        language={match?.[1]}
        PreTag="div"
        showLineNumbers={showLineNumbers}
        lineNumberStyle={showLineNumbers ? { minWidth: '2rem' } : undefined}
        wrapLines
      >
        {/* {String(children).replace(/\n$/, '')} */}
        {String(children)}
      </SyntaxHighlighter>
    </div>
  )
}

const InlineCode: React.FC<CodeProps> = ({ className, children }) => {
  return <code className={className}>{children}</code>
}

interface MessageProps extends Message {
  showTopicList: boolean
  showLineNumbers: boolean
}

const Message = memo(
  ({ content, role, time, showTopicList, showLineNumbers }: MessageProps) => {
    const sent = role === 'user'

    const remarkPlugins = useMemo(() => [remarkMath], [])
    const rehypePlugins = useMemo(() => [rehypeKatex], [])

    const [copied, setCopied] = useState(false)

    const renderCodeBlock = ({
      node,
      inline,
      className,
      children,
    }: CodeProps): React.ReactElement => {
      if (!(inline ?? false)) {
        return (
          <CodeBlock
            className={className}
            node={node}
            time={time}
            showLineNumbers={showLineNumbers}
          >
            {children}
          </CodeBlock>
        )
      }

      return (
        <InlineCode className={className} node={node}>
          {children}
        </InlineCode>
      )
    }

    const onCopy = async (): Promise<void> => {
      setCopied(true)
    }

    const onBlur = (): void => {
      setCopied(false)
    }

    return (
      <li
        className={`shared ${showTopicList ? 'max-with-menu' : 'max'} ${
          sent ? 'sent' : 'received'
        }`}
      >
        <CopyToClipboard text={content}>
          <Tooltip title="复制" placement="left">
            <Button
              size="small"
              shape="circle"
              className="copy-button"
              // type="primary"
              onClick={onCopy}
              onMouseLeave={onBlur}
            >
              {copied ? <CheckOutlined /> : <CopyOutlined />}
            </Button>
          </Tooltip>
        </CopyToClipboard>

        <ReactMarkdown
          components={{ code: renderCodeBlock }}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {content}
        </ReactMarkdown>
      </li>
    )
  }
)

Message.displayName = 'Message'

export default Message
