'use client'

import { cn } from '@/lib/utils'

interface ImportProgressProps {
  className?: string
}

export function ImportProgress({ className }: ImportProgressProps) {
  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <div className="flex gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600 [animation-delay:0.2s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600 [animation-delay:0.4s]" />
      </div>
      
      <p className="text-lg text-zinc-400">解析中...</p>
    </div>
  )
}