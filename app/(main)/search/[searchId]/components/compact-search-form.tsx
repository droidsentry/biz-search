"use client";

import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Search, Settings2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TagInputElegant } from "./tag-input-elegant";
import { TagInput } from "./tag-input";
import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from "@/lib/constants/google-custom-search";
import { useState, useEffect } from "react";

interface CompactSearchFormProps {
  searchId?: string;
  onSave?: () => void;
}

export function CompactSearchForm({
  searchId,
  onSave,
}: CompactSearchFormProps) {
  const { handleSearch, isLoading, isValidating, isNewSearch } =
    useGoogleCustomSearchForm();
  const form = useFormContext<GoogleCustomSearchPattern>();
  const advancedEnabled = form.watch(
    "googleCustomSearchParams.isAdvancedSearchEnabled"
  );
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  const defaultAdditionalKeywords =
    DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN.googleCustomSearchParams
      .additionalKeywords;
  const defaultSites =
    DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN.googleCustomSearchParams.searchSites;

  // 詳細オプションを有効にしたときに自動的に開く
  useEffect(() => {
    if (advancedEnabled) {
      setExpandedAdvanced(true);
    }
  }, [advancedEnabled]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">検索条件</h2>
          {isNewSearch && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={
                !form.getValues("googleCustomSearchParams.customerName")
              }
            >
              保存
            </Button>
          )}
        </div>

        {/* 基本検索 */}
        <div className="space-y-3">
          {/* 顧客氏名 */}
          <FormField
            control={form.control}
            name="googleCustomSearchParams.customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  顧客氏名 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 山田太郎"
                    className="h-9 text-sm"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="googleCustomSearchParams.customerNameExactMatch"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4 text-xs"
                  >
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="exact" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer">
                        完全一致
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer">
                        部分一致
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* 住所 */}
          <FormField
            control={form.control}
            name="googleCustomSearchParams.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">住所</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 東京都港区赤坂"
                    className="h-9 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="googleCustomSearchParams.addressExactMatch"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4 text-xs"
                  >
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="exact" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer">
                        完全一致
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer">
                        部分一致
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* 検索期間 */}
          <FormField
            control={form.control}
            name="googleCustomSearchParams.dateRestrict"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">検索期間</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="すべての期間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての期間</SelectItem>
                    <SelectItem value="y1">過去1年間</SelectItem>
                    <SelectItem value="y3">過去3年間</SelectItem>
                    <SelectItem value="y5">過去5年間</SelectItem>
                    <SelectItem value="y10">過去10年間</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* 詳細オプション */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">詳細オプション</span>
            </div>
            <FormField
              control={form.control}
              name="googleCustomSearchParams.isAdvancedSearchEnabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        // スイッチOFFの場合は詳細を閉じる
                        if (!checked) {
                          setExpandedAdvanced(false);
                        }
                      }}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {advancedEnabled && expandedAdvanced && (
            <div className="px-3 pb-3 space-y-3 border-t">
              {/* 追加キーワード */}
              <div className="pt-3">
                <Label className="text-sm">追加キーワード</Label>
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.additionalKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TagInputElegant
                          keywords={field.value || []}
                          onChange={field.onChange}
                          placeholder="役職など"
                          defaultKeywords={defaultAdditionalKeywords}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 検索対象サイト */}
              <div>
                <Label className="text-sm">検索対象サイト</Label>
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.searchSites"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="ドメイン"
                          defaultTags={defaultSites}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* 検索ボタン */}
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isValidating}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              検索中...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              検索
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
