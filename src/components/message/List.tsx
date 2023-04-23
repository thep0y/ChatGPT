import React, { lazy, memo } from 'react'

const Message = lazy(async () => await import('~/components/message/Message'))

const MessageList = memo(({ messages, showTopicList, showLineNumbers }: MessageListProps) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <React.Suspense fallback={null} key={time}>
        <Message
          content={content}
          role={role}
          time={time}
          showTopicList={showTopicList}
          showLineNumbers={showLineNumbers}
        />
      </React.Suspense>
    ))}
  </ol>
))

MessageList.displayName = 'MessageList'

export default MessageList
