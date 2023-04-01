/* eslint-disable react/prop-types */
import React, { lazy, memo } from 'react'

import '~/styles/Chat.scss'

const Message = lazy(async () => await import('~/components/message/Message'))

const MessageList: React.FC<MessageListProps> = memo(({ messages }) => (
  <ol className="list">
    {messages.map(({ content, role, time }) => (
      <React.Suspense fallback={null} key={time}>
        <Message content={content} role={role} time={time} />
      </React.Suspense>
    ))}
  </ol>
))

MessageList.displayName = 'MessageList'

export default MessageList
