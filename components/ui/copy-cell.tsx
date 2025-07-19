'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CopyCellProps {
  value: string
  className?: string
  truncate?: boolean
  title?: string
}

export function CopyCell({ value, className, truncate = true, title }: CopyCellProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setOpen(true)
      
      // 2秒後に自動的に閉じる
      setTimeout(() => {
        setCopied(false)
        setOpen(false)
      }, 2000)
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleCopy}
          className={cn(
            "text-left hover:bg-zinc-800/50 px-2 py-1 rounded transition-all duration-200 cursor-pointer w-full",
            "focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900",
            className
          )}
          title={title || value}
        >
          <span className={cn("block", truncate && "truncate")}>
            {value}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto p-2">
        <div className="flex items-center gap-2">
          {copied ? (
            <>
              <Check className="size-4 text-green-500" />
              <span className="text-sm">コピーしました！</span>
            </>
          ) : (
            <>
              <Copy className="size-4" />
              <span className="text-sm">クリックでコピー</span>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}