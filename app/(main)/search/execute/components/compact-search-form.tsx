"use client";

import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { ExternalLink, RefreshCcw, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { TagInput } from "./tag-input";
import { TagInputElegant } from "./tag-input-elegant";

interface CompactSearchFormProps {
  onSave?: () => void;
}

export function CompactSearchForm({ onSave }: CompactSearchFormProps) {
  const { handleSearch, isLoading, isValidating, isNewSearch, data, defaultPattern } =
    useGoogleCustomSearchForm();
  const form = useFormContext<GoogleCustomSearchPattern>();
  const advancedEnabled = form.watch(
    "googleCustomSearchParams.isAdvancedSearchEnabled"
  );
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  const defaultAdditionalKeywords =
    defaultPattern.googleCustomSearchParams.additionalKeywords;
  const defaultSites =
    defaultPattern.googleCustomSearchParams.searchSites;

  // 詳細オプションを有効にしたときに自動的に開く
  useEffect(() => {
    if (advancedEnabled) {
      setExpandedAdvanced(true);
    }
  }, [advancedEnabled]);

  // Eightボタンのクリック処理
  const handleEightClick = () => {
    // console.log("handleEightClick");
    const customerName = form.getValues(
      "googleCustomSearchParams.customerName"
    );
    if (customerName) {
      navigator.clipboard.writeText(customerName);
      toast.success("名前をクリップボードにコピーしました");
    }
  };
  console.log("data", data);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSearch, (errors) => {
          console.log("errors", errors);
        })}
        className="space-y-4"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">検索条件</h2>
          {isNewSearch && data && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={
                !form.getValues("googleCustomSearchParams.customerName")
              }
              className="cursor-pointer"
            >
              保存
            </Button>
          )}
          {!isNewSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // フォームをリセット
                form.reset(defaultPattern);
                // 新規検索ページへ遷移（検索結果もリセットされる）
                window.location.href = "/search/execute?patternId=new";
              }}
            >
              <RefreshCcw className="size-4" />
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
                    value={field.value}
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
                    value={field.value}
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
            render={({ field }) => {
              // console.log("field", field);
              return (
                <FormItem>
                  <FormLabel className="text-sm">検索期間</FormLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 gap-2 text-xs"
                  >
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        全て
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="m6" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        半年間
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="y1" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        1年間
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="y3" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        3年間
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="y5" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        5年間
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="y10" />
                      </FormControl>
                      <FormLabel className="text-xs cursor-pointer font-normal">
                        10年間
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              );
            }}
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
              <div className="space-y-2">
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

                {/* サイト検索モード */}
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.siteSearchMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-4 text-xs"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="any" id="any" />
                            <Label
                              htmlFor="any"
                              className="text-xs font-normal cursor-pointer"
                            >
                              すべて検索
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="specific" id="specific" />
                            <Label
                              htmlFor="specific"
                              className="text-xs font-normal cursor-pointer"
                            >
                              指定サイトのみ
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="exclude" id="exclude" />
                            <Label
                              htmlFor="exclude"
                              className="text-xs font-normal cursor-pointer"
                            >
                              指定サイト除外
                            </Label>
                          </div>
                        </RadioGroup>
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

        {/* 外部リンクボタン */}
        {form.watch("googleCustomSearchParams.customerName") && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-[#1877F2] hover:bg-[#1864C9] text-white w-full"
              asChild
            >
              <Link
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(
                  form.watch("googleCustomSearchParams.customerName")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex items-center justify-center gap-1">
                  Facebook
                  <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#0A66C2] hover:bg-[#0952A5] text-white w-full"
              asChild
            >
              <Link
                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                  form.watch("googleCustomSearchParams.customerName")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex items-center justify-center gap-1">
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white w-full"
              asChild
            >
              <Link
                href="https://8card.net/myhome?page=1&sort=exchangeDate&tab=network"
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={(e) => {
                  // 中クリック（ホイールクリック）の場合も関数を実行
                  if (e.button === 1) {
                    e.preventDefault();
                    handleEightClick();
                  }
                }}
                onClick={handleEightClick}
              >
                <span className="flex items-center justify-center gap-1">
                  Eight
                  <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
