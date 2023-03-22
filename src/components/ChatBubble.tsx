import React, { useState, useEffect } from 'react'
import '~/styles/ChatBubble.scss'

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, role, time }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

  useEffect(() => {
    if (isScrolledToBottom) {
      return
    }
    const node = document.getElementById('chat-bubble-container')

    if (node != null) {
      node.scrollTop = node.scrollHeight
      setIsScrolledToBottom(true)
    }
  }, [isScrolledToBottom])

  return (
    <div
      className={`chat-bubble ${role}`}
      onClick={() => { console.log('Clicked!') }}
    >
      {/* {!role && (
        <div className="chat-bubble__avatar">
          <img src={avatar} alt="Avatar" />
        </div>
      )} */}

      <div className="chat-bubble__message">{message}</div>
      <div className="chat-bubble__time">{time}</div>
    </div>
  )
}

export default ChatBubble
