'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline'

interface Member {
  id: string
  name: string
  email: string
  role: 'system_owner' | 'owner' | 'editor' | 'viewer'
  status: 'active' | 'pending'
  joinedAt: string
  avatarUrl?: string
}

// ダミーデータ
const members: Member[] = [
  {
    id: '1',
    name: '田中 太郎',
    email: 'tanaka@example.com',
    role: 'system_owner',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: '鈴木 花子',
    email: 'suzuki@example.com',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: '佐藤 次郎',
    email: 'sato@example.com',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: '山田 美咲',
    email: 'yamada@example.com',
    role: 'viewer',
    status: 'pending',
    joinedAt: '2024-05-01',
  },
]

export function MemberList() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const getRoleBadge = (role: Member['role']) => {
    switch (role) {
      case 'system_owner':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            システム管理者
          </Badge>
        )
      case 'owner':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            オーナー
          </Badge>
        )
      case 'editor':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            編集者
          </Badge>
        )
      case 'viewer':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            閲覧者
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
            アクティブ
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20">
            招待中
          </span>
        )
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const selectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id))
    }
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
          メンバー一覧
        </h3>
        <div className="mt-3 sm:ml-4 sm:mt-0">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {members.length} 名のメンバー
          </span>
        </div>
      </div>

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        checked={selectedMembers.length === members.length}
                        onChange={selectAllMembers}
                      />
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      名前
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      役割
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ステータス
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      参加日
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">アクション</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          value={member.id}
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {member.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {getStatusBadge(member.status)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <EllipsisHorizontalIcon className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>アクション</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              役割を編集
                            </DropdownMenuItem>
                            {member.status === 'pending' && (
                              <DropdownMenuItem>
                                <UserMinusIcon className="mr-2 h-4 w-4" />
                                招待を再送信
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <TrashIcon className="mr-2 h-4 w-4" />
                              メンバーを削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedMembers.length > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedMembers.length} 名を選択中
          </span>
          <Button variant="outline" size="sm">
            一括削除
          </Button>
        </div>
      )}
    </div>
  )
}