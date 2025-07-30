"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateAppSetting } from '../actions';
import type { AppSettings, AppSettingValue, SearchFormDefaults, GoogleCustomSearchPattern } from '@/lib/types/app-settings';
import SearchFormDefaultsEditor from './search-form-defaults-editor';
import GoogleSearchPatternEditor from './google-search-pattern-editor';
import JsonEditor from './json-editor';

interface ConstantsSettingsFormProps {
  settings: AppSettings[];
}

export default function ConstantsSettingsForm({ settings }: ConstantsSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, AppSettingValue>>({});
  
  // 設定をキーごとにマップに変換
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting;
    return acc;
  }, {} as Record<string, AppSettings>);
  
  const handleSave = async (key: string) => {
    setIsSaving(true);
    try {
      const value = editedSettings[key] || settingsMap[key]?.value;
      const result = await updateAppSetting(key, value);
      
      if (result.success) {
        toast.success('設定を保存しました');
        // 保存成功後、settingsMapを更新
        settingsMap[key] = {
          ...settingsMap[key],
          value: value,
          updated_at: new Date().toISOString()
        };
        // editedSettingsから削除
        delete editedSettings[key];
        setEditedSettings({ ...editedSettings });
      } else {
        toast.error(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      toast.error('エラーが発生しました');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleValueChange = (key: string, value: AppSettingValue) => {
    setEditedSettings({
      ...editedSettings,
      [key]: value
    });
  };
  
  const hasChanges = (key: string) => {
    return key in editedSettings;
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="search_form" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search_form">検索フォーム</TabsTrigger>
          <TabsTrigger value="google_search">Google検索</TabsTrigger>
          <TabsTrigger value="raw">JSON編集</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search_form" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>検索フォームのデフォルト値</CardTitle>
                  <CardDescription>
                    検索フォームの初期値として使用される設定です
                  </CardDescription>
                </div>
                {hasChanges('search_form_defaults') && (
                  <Badge variant="secondary">未保存の変更</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <SearchFormDefaultsEditor
                value={(editedSettings['search_form_defaults'] || settingsMap['search_form_defaults']?.value || {}) as SearchFormDefaults}
                onChange={(value) => handleValueChange('search_form_defaults', value)}
              />
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => handleSave('search_form_defaults')}
                  disabled={isSaving || !hasChanges('search_form_defaults')}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="google_search" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Custom Searchパターン</CardTitle>
                  <CardDescription>
                    Google Custom Search APIで使用されるデフォルトパターンです
                  </CardDescription>
                </div>
                {hasChanges('google_custom_search_pattern') && (
                  <Badge variant="secondary">未保存の変更</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <GoogleSearchPatternEditor
                value={(editedSettings['google_custom_search_pattern'] || settingsMap['google_custom_search_pattern']?.value || {}) as GoogleCustomSearchPattern}
                onChange={(value) => handleValueChange('google_custom_search_pattern', value)}
              />
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => handleSave('google_custom_search_pattern')}
                  disabled={isSaving || !hasChanges('google_custom_search_pattern')}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="raw" className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-mono text-sm">{setting.key}</CardTitle>
                    {setting.description && (
                      <CardDescription>{setting.description}</CardDescription>
                    )}
                  </div>
                  {hasChanges(setting.key) && (
                    <Badge variant="secondary">未保存の変更</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  value={editedSettings[setting.key] || setting.value}
                  onChange={(value) => handleValueChange(setting.key, value)}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={isSaving || !hasChanges(setting.key)}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}