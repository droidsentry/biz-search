import { createClient } from '@/lib/supabase/server'
import { DisplayNameForm } from './components/display-name-form'
import { UsernameForm } from './components/username-form'
import { SettingsCard } from './components/settings-card'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="space-y-6">
      <SettingsCard
        title="表示名"
        description="他のユーザーに表示される名前です"
      >
        <DisplayNameForm currentDisplayName={user?.user_metadata?.displayName} />
      </SettingsCard>

      <SettingsCard
        title="ユーザー名"
        description="一意のユーザー名です。ログイン時に使用できます"
      >
        <UsernameForm currentUsername={profile?.username || undefined} />
      </SettingsCard>
    </div>
  )
}
