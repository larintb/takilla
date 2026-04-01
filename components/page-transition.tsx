'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isBackNav, setIsBackNav] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      setIsBackNav(true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div
      key={pathname}
      className={isBackNav ? 'page-enter-left' : 'page-enter-right'}
      onAnimationEnd={() => setIsBackNav(false)}
    >
      {children}
    </div>
  )
}
