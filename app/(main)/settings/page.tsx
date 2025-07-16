'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">設定</h1>
        <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                基本的なプロフィール情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">会社名</Label>
                <Input id="company" placeholder="株式会社サンプル" defaultValue="BizSearch Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" placeholder="info@example.com" defaultValue="contact@bizsearch.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">タイムゾーン</Label>
                <Select defaultValue="jst">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jst">日本標準時 (JST)</SelectItem>
                    <SelectItem value="utc">協定世界時 (UTC)</SelectItem>
                    <SelectItem value="pst">太平洋標準時 (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>アプリケーション設定</CardTitle>
              <CardDescription>
                アプリケーションの動作を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">自動保存</Label>
                  <p className="text-sm text-muted-foreground">
                    変更を自動的に保存します
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                通知の受信方法を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">メール通知</Label>
                  <p className="text-sm text-muted-foreground">
                    重要な更新をメールで受け取ります
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">プッシュ通知</Label>
                  <p className="text-sm text-muted-foreground">
                    ブラウザのプッシュ通知を有効にします
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API設定</CardTitle>
              <CardDescription>
                APIキーとWebhookを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">APIキー</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  defaultValue="sk-xxxxxxxxxxxxxxxxxxxxxxxx" 
                  readOnly 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input 
                  id="webhook-url" 
                  placeholder="https://example.com/webhook" 
                />
              </div>
              <Button variant="outline">新しいAPIキーを生成</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API利用状況</CardTitle>
              <CardDescription>
                過去30日間のAPI利用統計
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>総リクエスト数</span>
                  <span className="font-medium">125,432</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>成功率</span>
                  <span className="font-medium">99.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>平均レスポンス時間</span>
                  <span className="font-medium">145ms</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>エンドポイント別利用状況</Label>
                <div className="space-y-2">
                  {[
                    { endpoint: '/api/search', usage: 45000 },
                    { endpoint: '/api/companies', usage: 32000 },
                    { endpoint: '/api/analytics', usage: 28000 },
                    { endpoint: '/api/users', usage: 15000 },
                    { endpoint: '/api/reports', usage: 5432 },
                  ].map((item) => (
                    <div key={item.endpoint} className="flex items-center justify-between py-1">
                      <span className="text-sm font-mono">{item.endpoint}</span>
                      <span className="text-sm text-muted-foreground">{item.usage.toLocaleString()} calls</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティ設定</CardTitle>
              <CardDescription>
                アカウントのセキュリティを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">現在のパスワード</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新しいパスワード</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">パスワードの確認</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>パスワードを更新</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>二要素認証</CardTitle>
              <CardDescription>
                アカウントのセキュリティを強化します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS認証</Label>
                  <p className="text-sm text-muted-foreground">
                    ログイン時にSMSで認証コードを送信します
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>認証アプリ</Label>
                  <p className="text-sm text-muted-foreground">
                    Google AuthenticatorやAuthyを使用します
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ログイン履歴</CardTitle>
              <CardDescription>
                最近のログイン活動を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { device: 'Chrome - Windows', location: '東京, 日本', time: '2時間前', status: 'success' },
                  { device: 'Safari - iPhone', location: '大阪, 日本', time: '1日前', status: 'success' },
                  { device: 'Firefox - Mac', location: 'ニューヨーク, アメリカ', time: '3日前', status: 'failed' },
                  { device: 'Chrome - Android', location: '東京, 日本', time: '1週間前', status: 'success' },
                  { device: 'Edge - Windows', location: 'ロンドン, イギリス', time: '2週間前', status: 'success' },
                ].map((login, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{login.device}</p>
                      <p className="text-xs text-muted-foreground">{login.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{login.time}</p>
                      <p className={`text-xs ${login.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {login.status === 'success' ? '成功' : '失敗'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline">キャンセル</Button>
        <Button>変更を保存</Button>
      </div>
    </div>
  )
}