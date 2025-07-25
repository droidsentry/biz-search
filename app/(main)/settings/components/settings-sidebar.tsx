'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChartBarIcon, UsersIcon, ShieldIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SettingsSidebar() {
  const pathname = usePathname()
  const [isSystemOwner, setIsSystemOwner] = useState(false)
  
  useEffect(() => {
    const checkSystemOwner = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      setIsSystemOwner(profile?.role === 'system_owner')
    }
    
    checkSystemOwner()
  }, [])
  
  const navigation = [
    { name: 'API使用状況', href: '/settings', icon: ChartBarIcon },
    { name: 'メンバー管理', href: '/settings/members', icon: UsersIcon },
    ...(isSystemOwner ? [{ name: 'API制限管理', href: '/settings/api-limits', icon: ShieldIcon }] : []),
  ]

  return (
    <div className="sticky top-0 w-64 hidden lg:block mr-0 lg:mr-12">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
            key={item.href}
            variant="ghost"
            className={cn(
              'w-full justify-start',
              isActive ? 'bg-accent text-foreground' : 'text-muted-foreground'
            )}
            asChild
            >
              <Link href={item.href}>
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            </Button>
          )
        })}
      </nav>

    </div>
  )
}