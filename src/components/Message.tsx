/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async'
import { dark as CodeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'

const Message: React.FC<Message> = memo(({ content, role, time }) => {
  const sent = role === 'user'

  const renderCodeBlock = ({
    node,
    inline,
    className,
    children,
    ...props
  }: CodeProps): React.ReactElement => {
    const match = /language-(\w+)/.exec(className ?? '')

    if (!(inline ?? false) && match != null) {
      return (
        <SyntaxHighlighter
          style={CodeStyle as any}
          language={match[1]}
          PreTag="div"
          showLineNumbers
          showInlineLineNumbers
          wrapLines
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <li className={`shared ${sent ? 'sent' : 'received'}`}>
      <ReactMarkdown components={{ code: renderCodeBlock }}>
        {content}
      </ReactMarkdown>
    </li>
  )
})

Message.displayName = 'Message'

export default Message
