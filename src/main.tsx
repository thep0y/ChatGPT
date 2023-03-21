import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// import '~/styles/index.scss'
// import TitleBar from '~/components/TitleBar'

const Chat = lazy(async () => await import('~/components/chat'))

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <React.Suspense>
        <Chat />
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
