/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async'
import { dark as CodeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

import 'katex/dist/katex.min.css'

const Message: React.FC<Message> = memo(({ content, role, time }) => {
  const sent = role === 'user'

  CodeStyle['code[class*="language-"]'].fontFamily = 'var(--user-monospace)'

  const renderCodeBlock = ({
    node,
    inline,
    className,
    children,
    ...props
  }: CodeProps): React.ReactElement => {
    const match = /language-(\w+)/.exec(className ?? '')

    if (!(inline ?? false)) {
      return (
        <SyntaxHighlighter
          style={CodeStyle as any}
          customStyle={{ fontFamily: 'var(--user-monospace)' }}
          language={(match != null) ? match[1] : undefined}
          PreTag="div"
          showLineNumbers
          showInlineLineNumbers
          lineNumberStyle={{ minWidth: '2rem' }}
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
      <ReactMarkdown
        components={{ code: renderCodeBlock }}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </li>
  )
})

Message.displayName = 'Message'

export default Message
