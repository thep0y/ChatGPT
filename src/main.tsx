import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// import '~/styles/index.scss'
// import TitleBar from '~/components/TitleBar'
import '~/styles/index.scss'

const ChatPage = lazy(async () => await import('~/components/ChatPage'))

if (import.meta.env.DEV) {
  const tempLog = console.log

  console.log = (prefix: string, msg: any): void => {
    tempLog.apply(console, [`[${new Date().toLocaleString()}]`, prefix, '>>>', msg])
  }
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <React.Suspense>
        <ChatPage />
      </React.Suspense>
    )
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* <TitleBar /> */}
    <RouterProvider router={router} />
  </React.StrictMode>
)
