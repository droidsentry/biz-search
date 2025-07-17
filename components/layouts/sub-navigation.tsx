'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useScrollRange } from '@/hooks/use-scroll-range'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/property-import', label: 'インポート' },
  { href: '/property-list', label: '物件一覧' },
  { href: '/search', label: 'カスタム検索' },
  { href: '/logs', label: 'ログ' },
  { href: '/settings', label: '設定' },
]

export function SubNavigation() {
  const pathname = usePathname()
  const navX = useScrollRange(0, 50, 0, 50) // スクロール時に右に50px移動
  const [indicatorStyle, setIndicatorStyle] = useState({ transform: 'translateX(0)', width: '0px', display: 'none' })
  const activeRef = useRef<HTMLAnchorElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const activeRect = activeRef.current.getBoundingClientRect()
      const translateX = activeRect.left - containerRect.left // padding offset なし
      
      setIndicatorStyle({
        transform: `translateX(${translateX}px)`,
        width: `${activeRect.width}px`,
        display: 'block',
      })
    }
  }, [pathname])

  return (
    <div 
      className="sticky top-0 z-[49] border-b border-border bg-muted shadow-[inset_0_-1px] shadow-black/10 dark:shadow-white/10"
    >
      <div className="mx-auto max-w-[1400px] w-full">
        <div 
          ref={containerRef}
          className="relative flex h-[46px] items-center px-2 md:px-4 [&>*]:shrink-0 transition-transform duration-50 ease-linear"
          style={{
            transform: `translateX(${navX}px)`,
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={isActive ? activeRef : undefined}
                data-active={isActive}
                className={cn(
                  'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
                  'ring-offset-background transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ',
                  'disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 no-underline hover:bg-accent-foreground/10 hover:text-accent-foreground',
                  isActive 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
          
          {/* アクティブインジケーター */}
          <div 
            className="absolute bottom-0 left-0 h-[2px] origin-[0_0_0] bg-foreground dark:bg-white transition-all duration-150"
            style={{
              transform: indicatorStyle.transform,
              width: indicatorStyle.width,
              display: indicatorStyle.display,
            }}
          />
        </div>
      </div>
    </div>
  )
}