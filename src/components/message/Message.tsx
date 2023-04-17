import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async'
import { dark as CodeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

import 'katex/dist/katex.min.css'

const CodeBlock: React.FC<CodeProps> = ({ children, className }) => {
  const match = useMemo(
    () => /language-(\w+)/.exec(className ?? ''),
    [className]
  )

  CodeStyle['code[class*="language-"]'].fontFamily = 'inherit'

  return (
    <SyntaxHighlighter
      style={CodeStyle as any}
      customStyle={{ fontFamily: 'var(--user-monospace)' }}
      language={match?.[1]}
      PreTag="div"
      showLineNumbers
      showInlineLineNumbers
      lineNumberStyle={{ minWidth: '2rem' }}
      wrapLines
    >
      {/* {String(children).replace(/\n$/, '')} */}
      {String(children)}
    </SyntaxHighlighter>
  )
}

const InlineCode: React.FC<CodeProps> = ({ className, children }) => {
  return <code className={className}>{children}</code>
}

const Message = memo(({ content, role, time, showTopicList }: Message & { showTopicList: boolean }) => {
  const sent = role === 'user'

  const remarkPlugins = useMemo(() => [remarkMath], [])
  const rehypePlugins = useMemo(() => [rehypeKatex], [])
  const renderCodeBlock = ({
    node,
    inline,
    className,
    children
  }: CodeProps): React.ReactElement => {
    if (!(inline ?? false)) {
      return (
        <CodeBlock className={className} node={node}>
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

  return (
    <li className={`shared ${showTopicList ? 'max-with-menu' : 'max'} ${sent ? 'sent' : 'received'}`}>
      <ReactMarkdown
        components={{ code: renderCodeBlock }}
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </li>
  )
})

Message.displayName = 'Message'

export default Message
