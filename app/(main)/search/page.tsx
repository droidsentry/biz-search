'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import Link from 'next/link'

export default function SearchPage() {

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      <div className="border-0 border-b border-solid flex items-center justify-between">
        <h1 className="my-10 text-3xl font-bold">カスタム検索</h1>
        <Link href="/search/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規検索パターン
          </Button>
        </Link>
      </div>
    </div>
  )
}