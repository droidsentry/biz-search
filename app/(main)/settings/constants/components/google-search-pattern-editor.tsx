"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

import type { GoogleCustomSearchPattern } from '@/lib/types/app-settings';

interface GoogleSearchPatternEditorProps {
  value: GoogleCustomSearchPattern;
  onChange: (value: GoogleCustomSearchPattern) => void;
}

export default function GoogleSearchPatternEditor({ value, onChange }: GoogleSearchPatternEditorProps) {
  const updateField = <K extends keyof GoogleCustomSearchPattern>(field: K, fieldValue: GoogleCustomSearchPattern[K]) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };
  
  const updateParams = <K extends keyof GoogleCustomSearchPattern['googleCustomSearchParams']>(
    field: K,
    fieldValue: GoogleCustomSearchPattern['googleCustomSearchParams'][K]
  ) => {
    onChange({
      ...value,
      googleCustomSearchParams: {
        ...value.googleCustomSearchParams,
        [field]: fieldValue
      }
    });
  };
  
  const addKeyword = () => {
    const currentKeywords = value.googleCustomSearchParams?.additionalKeywords || [];
    updateParams('additionalKeywords', [
      ...currentKeywords,
      { value: '', matchType: 'partial' }
    ]);
  };
  
  const removeKeyword = (index: number) => {
    const currentKeywords = value.googleCustomSearchParams?.additionalKeywords || [];
    updateParams('additionalKeywords', currentKeywords.filter((_, i) => i !== index));
  };
  
  const updateKeyword = (index: number, field: string, fieldValue: string) => {
    const currentKeywords = value.googleCustomSearchParams?.additionalKeywords || [];
    updateParams('additionalKeywords', currentKeywords.map((keyword, i) => 
      i === index ? { ...keyword, [field]: fieldValue } : keyword
    ));
  };
  
  const addSite = () => {
    const currentSites = value.googleCustomSearchParams?.searchSites || [];
    updateParams('searchSites', [...currentSites, '']);
  };
  
  const removeSite = (index: number) => {
    const currentSites = value.googleCustomSearchParams?.searchSites || [];
    updateParams('searchSites', currentSites.filter((_: string, i: number) => i !== index));
  };
  
  const updateSite = (index: number, site: string) => {
    const currentSites = value.googleCustomSearchParams?.searchSites || [];
    updateParams('searchSites', currentSites.map((s: string, i: number) => 
      i === index ? site : s
    ));
  };
  
  return (
    <div className="space-y-6">
      {/* パターン基本情報 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">パターン基本情報</h3>
        
        <div className="grid gap-4">
          <div>
            <Label>パターン名</Label>
            <Input
              value={value.searchPatternName || ''}
              onChange={(e) => updateField('searchPatternName', e.target.value)}
              placeholder="新規検索パターン"
            />
          </div>
          
          <div>
            <Label>パターン説明</Label>
            <Textarea
              value={value.searchPatternDescription || ''}
              onChange={(e) => updateField('searchPatternDescription', e.target.value)}
              placeholder="このパターンの説明を入力"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      {/* 検索パラメータ */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">検索パラメータ</h3>
        
        <div className="grid gap-4">
          <div>
            <Label>顧客名マッチタイプ</Label>
            <RadioGroup
              value={value.googleCustomSearchParams?.customerNameExactMatch || 'exact'}
              onValueChange={(val) => updateParams('customerNameExactMatch', val as 'exact' | 'partial')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="customer-exact" />
                <Label htmlFor="customer-exact">完全一致</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="customer-partial" />
                <Label htmlFor="customer-partial">部分一致</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label>住所マッチタイプ</Label>
            <RadioGroup
              value={value.googleCustomSearchParams?.addressExactMatch || 'partial'}
              onValueChange={(val) => updateParams('addressExactMatch', val as 'exact' | 'partial')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="google-address-exact" />
                <Label htmlFor="google-address-exact">完全一致</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="google-address-partial" />
                <Label htmlFor="google-address-partial">部分一致</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="google-advanced"
              checked={value.googleCustomSearchParams?.isAdvancedSearchEnabled || false}
              onCheckedChange={(checked) => updateParams('isAdvancedSearchEnabled', checked)}
            />
            <Label htmlFor="google-advanced">詳細検索をデフォルトで有効にする</Label>
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
          {(value.googleCustomSearchParams?.additionalKeywords || []).map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={keyword.value}
                onChange={(e) => updateKeyword(index, 'value', e.target.value)}
                placeholder="キーワード"
                className="flex-1"
              />
              <RadioGroup
                value={keyword.matchType}
                onValueChange={(val) => updateKeyword(index, 'matchType', val)}
                className="flex items-center gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="exact" id={`google-keyword-exact-${index}`} />
                  <Label htmlFor={`google-keyword-exact-${index}`} className="text-xs">完全</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="partial" id={`google-keyword-partial-${index}`} />
                  <Label htmlFor={`google-keyword-partial-${index}`} className="text-xs">部分</Label>
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
            value={value.googleCustomSearchParams?.siteSearchMode || 'any'}
            onValueChange={(val) => updateParams('siteSearchMode', val as 'any' | 'specific' | 'exclude')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="google-site-any" />
              <Label htmlFor="google-site-any">すべて検索</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="google-site-specific" />
              <Label htmlFor="google-site-specific">指定サイトのみ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exclude" id="google-site-exclude" />
              <Label htmlFor="google-site-exclude">指定サイト除外</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          {(value.googleCustomSearchParams?.searchSites || []).map((site: string, index: number) => (
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