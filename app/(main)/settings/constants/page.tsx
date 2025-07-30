import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConstantsSettingsForm from './components/constants-settings-form';
import type { AppSettings } from '@/lib/types/app-settings';

export default async function ConstantsSettingsPage() {
  const supabase = await createClient();
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // システムオーナーチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'system_owner') {
    redirect('/');
  }
  
  // 設定データの取得
  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .order('key');
  
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">定数設定管理</h1>
          <p className="text-muted-foreground">
            アプリケーション全体で使用される定数を管理します
          </p>
        </div>
        
        <ConstantsSettingsForm settings={(settings || []) as AppSettings[]} />
      </div>
    </div>
  );
}