// Dữ liệu mẫu ban đầu của danh mục phải nạp trước mọi trang (xem context/catalogSeed.ts)
import '@context/catalogSeed'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LazyMotion } from 'motion/react'
import App from './App'
import './styles/index.css'

// motion tải gọn: chỉ phần lõi ở file đầu, bộ tính năng tải sau. `strict`: dùng nhầm `m.div` (bản nặng) sẽ báo lỗi ngay
const loadMotionFeatures = () => import('@components/motion/motionFeatures').then((r) => r.default)

// Data router (thay BrowserRouter) để dùng useBlocker: hỏi lại trước khi rời khu làm việc (LeaveDashboardDialog).
// Một route bắt mọi đường dẫn; toàn bộ định tuyến vẫn nằm trong <Routes> của App như trước.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <>
        <App />
        <Toaster position="top-right" />
      </>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <RouterProvider router={router} />
    </LazyMotion>
  </React.StrictMode>,
)
