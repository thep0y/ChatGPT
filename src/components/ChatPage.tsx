import React, { useState } from 'react'
import { Layout } from 'antd'
import Chat from '~/components/Chat'
import { invoke } from '@tauri-apps/api'
import { now } from '~/lib'
import '~/styles/ChatPage.scss'

const { Header, Content } = Layout

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { content: '使用 rust 写一个冒泡排序，回答中的代码块要声明使用的语言。', role: 'user', time: now() - 10 },
    { content: '\n\n使用 Rust 写一个冒泡排 序算法示例代码：\n\n```rust\nfn bubble_sort(arr: &mut [i32]) {\n    let n = arr.len();\n    for i in 0..n {\n        for j in 0..n-i-1 {\n            if arr[j] > arr[j+1] {\n                arr.swap(j, j+1);\n            }\n        }\n    }\n}\n\nfn main() {\n    let mut arr = vec![64, 34, 25, 12, 22, 11, 90];\n    bubble_sort(&mut arr);\n    println!("排序后的数组：{:?}", arr);\n}\n```\n\n在上面的代码 中，我们首先定义了一个 `bubble_sort` 函数，它接受一个可变的整型切片作为参数，使用冒泡排序算法对其进行 排序。\n\n具体来说，内层的循环从数组的第一个元素开始，一直到 `n-i-1` 个元素，每次比较相邻两个元素的大 小，如果前面的元素比后面的元素大，就将它们交换位置。这样一次冒泡排序之后，数组的最后一个元素就是当前未排序的最大值。\n\n外层的循环执行 `n` 次，每次执行一次内层循环，可以保证整个数组都被排序完毕。\n\n在 `main` 函数中，我们首先定义一个包含一些无序元素的整型数组 `arr`，然后调用 `bubble_sort` 函数对其进行排序，并输出排序后的结果。', role: 'assistant', time: now() }
  ])

  // invoke('get_models').then(r => {
  //   console.log(r)
  // }).catch(e => {
  //   console.error(e)
  // })

  const handleSendMessage = async (message: string): Promise<void> => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: message, role: 'user', time: now() }
    ])
    // TODO: 使用 Tauri API 发送消息并接收 ChatGPT 的回复

    try {
      const resp = await invoke<ChatGPTResponse>('chat_gpt', {
        text: message,
        model: ''
      })

      setMessages((prevMessages) => [...prevMessages, resp.choices[0].message])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Layout>
      <Header className="chat-title">
        <h2> 这是对话标题 </h2>
      </Header>

      <Content>
        <Chat messages={messages} onSendMessage={handleSendMessage} />
      </Content>
    </Layout>
  )
}

export default ChatPage
