import React, { useRef, useLayoutEffect } from 'react'
import PerfectScrollbar from 'perfect-scrollbar'
import 'perfect-scrollbar/css/perfect-scrollbar.css'
import '~/styles/Scrollbar.scss'
import { smoothScrollTo } from '.'

interface CustomScrollbarProps {
  children: React.ReactNode
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const current = scrollRef.current

    if (!current) {
      return
    }

    const ps = new PerfectScrollbar(current, {
      // 根据需要设置选项
      suppressScrollX: true
    })

    smoothScrollTo(current, ps.contentHeight, 1000)

    return () => {
      ps.destroy()
    }
  })

  return (
    <div className="custom-scrollbar" ref={scrollRef}>
      {children}
    </div>
  )
}

export default CustomScrollbar
