"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

import type { SearchFormDefaults } from '@/lib/types/app-settings';

interface SearchFormDefaultsEditorProps {
  value: SearchFormDefaults;
  onChange: (value: SearchFormDefaults) => void;
}

export default function SearchFormDefaultsEditor({ value, onChange }: SearchFormDefaultsEditorProps) {
  const updateField = <K extends keyof SearchFormDefaults>(
    field: K, 
    fieldValue: SearchFormDefaults[K]
  ) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };
  
  const addKeyword = () => {
    const currentKeywords = value.additionalKeywords || [];
    updateField('additionalKeywords', [
      ...currentKeywords,
      { value: '', matchType: 'exact' }
    ]);
  };
  
  const removeKeyword = (index: number) => {
    const currentKeywords = value.additionalKeywords || [];
    updateField('additionalKeywords', currentKeywords.filter((_, i) => i !== index));
  };
  
  const updateKeyword = (index: number, field: 'value' | 'matchType', fieldValue: string) => {
    const currentKeywords = value.additionalKeywords || [];
    updateField('additionalKeywords', currentKeywords.map((keyword, i) => 
      i === index ? { ...keyword, [field]: fieldValue } : keyword
    ));
  };
  
  const addSite = () => {
    const currentSites = value.searchSites || [];
    updateField('searchSites', [...currentSites, '']);
  };
  
  const removeSite = (index: number) => {
    const currentSites = value.searchSites || [];
    updateField('searchSites', currentSites.filter((_, i) => i !== index));
  };
  
  const updateSite = (index: number, site: string) => {
    const currentSites = value.searchSites || [];
    updateField('searchSites', currentSites.map((s, i) => 
      i === index ? site : s
    ));
  };
  
  return (
    <div className="space-y-6">
      {/* 基本設定 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">基本設定</h3>
        
        <div className="grid gap-4">
          <div>
            <Label>所有者名マッチタイプ</Label>
            <RadioGroup
              value={value.ownerNameMatchType || 'exact'}
              onValueChange={(val) => updateField('ownerNameMatchType', val as 'exact' | 'partial')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="owner-exact" />
                <Label htmlFor="owner-exact">完全一致</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="owner-partial" />
                <Label htmlFor="owner-partial">部分一致</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label>所有者住所マッチタイプ</Label>
            <RadioGroup
              value={value.ownerAddressMatchType || 'partial'}
              onValueChange={(val) => updateField('ownerAddressMatchType', val as 'exact' | 'partial')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="address-exact" />
                <Label htmlFor="address-exact">完全一致</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="address-partial" />
                <Label htmlFor="address-partial">部分一致</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label>検索期間</Label>
            <RadioGroup
              value={value.period || 'all'}
              onValueChange={(val) => updateField('period', val as 'all' | 'last_6_months' | 'last_year' | 'last_3_years' | 'last_5_years' | 'last_10_years')}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="period-all" />
                  <Label htmlFor="period-all">全期間</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="last_6_months" id="period-6m" />
                  <Label htmlFor="period-6m">半年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="last_year" id="period-1y" />
                  <Label htmlFor="period-1y">1年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="last_3_years" id="period-3y" />
                  <Label htmlFor="period-3y">3年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="last_5_years" id="period-5y" />
                  <Label htmlFor="period-5y">5年</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="last_10_years" id="period-10y" />
                  <Label htmlFor="period-10y">10年</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced"
              checked={value.isAdvancedSearchEnabled || false}
              onCheckedChange={(checked) => updateField('isAdvancedSearchEnabled', checked)}
            />
            <Label htmlFor="advanced">詳細オプションをデフォルトで有効にする</Label>
          </div>
        </div>
      </div>
      
      {/* 追加キーワード */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">追加キーワード</h3>
          <Button size="sm" variant="outline" onClick={addKeyword}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
        
        <div className="space-y-2">
          {(value.additionalKeywords || []).map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={keyword.value}
                onChange={(e) => updateKeyword(index, 'value', e.target.value)}
                placeholder="キーワード"
                className="flex-1"
              />
              <RadioGroup
                value={keyword.matchType}
                onValueChange={(val) => updateKeyword(index, 'matchType', val as 'exact' | 'partial')}
                className="flex items-center gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="exact" id={`keyword-exact-${index}`} />
                  <Label htmlFor={`keyword-exact-${index}`} className="text-xs">完全</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="partial" id={`keyword-partial-${index}`} />
                  <Label htmlFor={`keyword-partial-${index}`} className="text-xs">部分</Label>
                </div>
              </RadioGroup>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeKeyword(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 検索対象サイト */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">検索対象サイト</h3>
          <Button size="sm" variant="outline" onClick={addSite}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
        
        <div>
          <Label>サイト検索モード</Label>
          <RadioGroup
            value={value.siteSearchMode || 'any'}
            onValueChange={(val) => updateField('siteSearchMode', val as 'any' | 'specific' | 'exclude')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="site-any" />
              <Label htmlFor="site-any">すべて検索</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="site-specific" />
              <Label htmlFor="site-specific">指定サイトのみ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exclude" id="site-exclude" />
              <Label htmlFor="site-exclude">指定サイト除外</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          {(value.searchSites || []).map((site: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={site}
                onChange={(e) => updateSite(index, e.target.value)}
                placeholder="example.com"
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSite(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}