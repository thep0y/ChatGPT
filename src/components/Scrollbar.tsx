import React, { useRef, useEffect } from 'react'
import PerfectScrollbar from 'perfect-scrollbar'
import 'perfect-scrollbar/css/perfect-scrollbar.css'
import '~/styles/Scrollbar.scss'

interface CustomScrollbarProps {
  children: React.ReactNode
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current === null) {
      return
    }

    const ps = new PerfectScrollbar(scrollRef.current, {
      // 根据需要设置选项
      suppressScrollX: true
    })

    return () => {
      ps.destroy()
    }
  }, [])

  return (
    <div className="custom-scrollbar" ref={scrollRef}>
      {children}
    </div>
  )
}

export default CustomScrollbar
