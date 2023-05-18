import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
// import '~/styles/index.scss'
// import TitleBar from '~/components/TitleBar'
import { ConfigProvider, theme } from 'antd'
import '~/styles/index.scss'
import { appWindow } from '@tauri-apps/api/window'

const ChatPage = lazy(async () => await import('~/components/ChatPage'))

// if (import.meta.env.DEV) {
//   const tempLog = console.log

//   console.log = (prefix: string, msg: any): void => {
//     if (msg) {
//       tempLog.apply(console, [`[${new Date().toLocaleString()}]`, prefix, '>>>', msg])
//     } else {
//       tempLog.apply(console, [`[${new Date().toLocaleString()}]`, prefix])
//     }
//   }
// }

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/1?name=自由主题" />,
    children: [

    ]
  },
  {
    path: '/:topicID',
    element: (
      <React.Suspense>
        <ChatPage />
      </React.Suspense>
    )
  }
])

appWindow.theme().then(v => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ConfigProvider theme={{
        // algorithm: v === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm
        algorithm:  theme.defaultAlgorithm
      }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </React.StrictMode>
  )
}).catch(() => {})
