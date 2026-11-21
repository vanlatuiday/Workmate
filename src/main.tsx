// Dữ liệu mẫu ban đầu của danh mục phải nạp trước mọi trang (xem context/catalogSeed.ts)
import '@context/catalogSeed'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LazyMotion } from 'motion/react'
import App from './App'
import './styles/index.css'

// motion tải gọn: chỉ phần lõi ở file đầu, bộ tính năng tải sau. `strict`: dùng nhầm `m.div` (bản nặng) sẽ báo lỗi ngay
const loadMotionFeatures = () => import('@components/motion/motionFeatures').then((r) => r.default)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </LazyMotion>
  </React.StrictMode>,
)
