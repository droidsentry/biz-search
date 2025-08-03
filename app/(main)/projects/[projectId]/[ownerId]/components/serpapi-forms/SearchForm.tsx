"use client";

import { TagInput } from "./tag-input";
import { TagInputElegant } from "./tag-input-elegant";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { searchFormSchema, type SearchFormData, type DefaultSearchFormData } from "@/lib/schemas/serpapi";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface SearchFormProps {
  projectId: string;
  ownerId: string;
  initialOwnerName?: string;
  initialOwnerAddress?: string;
  isSearching?: boolean;
  searchFormDefaults: DefaultSearchFormData;
}

export default function SearchForm({
  projectId,
  ownerId,
  initialOwnerName,
  initialOwnerAddress,
  isSearching = false,
  searchFormDefaults,
}: SearchFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 初期値の設定
  const defaultValues: SearchFormData = {
    ...searchFormDefaults,
    ownerName:
      searchParams.get("ownerName") ||
      initialOwnerName ||
      searchFormDefaults.ownerName,
    ownerNameMatchType:
      (searchParams.get("ownerNameMatchType") as "exact" | "partial") ||
      searchFormDefaults.ownerNameMatchType,
    ownerAddress:
      searchParams.get("ownerAddress") ||
      initialOwnerAddress ||
      searchFormDefaults.ownerAddress,
    ownerAddressMatchType:
      (searchParams.get("ownerAddressMatchType") as "exact" | "partial") ||
      searchFormDefaults.ownerAddressMatchType,
    siteSearchMode:
      (searchParams.get("siteSearchMode") as "any" | "specific" | "exclude") ||
      searchFormDefaults.siteSearchMode,
    isAdvancedSearchEnabled:
      searchParams.get("isAdvancedSearchEnabled") === "true" ||
      searchFormDefaults.isAdvancedSearchEnabled,
    period:
      (searchParams.get("period") as
        | "all"
        | "last_6_months"
        | "last_year"
        | "last_3_years"
        | "last_5_years"
        | "last_10_years") || searchFormDefaults.period,
  };

  // additionalKeywordsの初期化
  const urlKeywords: typeof searchFormDefaults.additionalKeywords = [];
  let index = 0;
  while (true) {
    const value = searchParams.get(`additionalKeywords[${index}][value]`);
    const matchType = searchParams.get(
      `additionalKeywords[${index}][matchType]`
    ) as "exact" | "partial";
    if (!value) break;
    urlKeywords.push({ value, matchType: matchType || "partial" });
    index++;
  }

  // URLにキーワードがある場合はそれを使用、なければデフォルト値を使用
  if (urlKeywords.length > 0) {
    defaultValues.additionalKeywords = urlKeywords;
  }

  // searchSitesの初期化
  const urlSites: string[] = [];
  let siteIndex = 0;
  while (true) {
    const site = searchParams.get(`searchSites[${siteIndex}]`);
    if (!site) break;
    urlSites.push(site);
    siteIndex++;
  }

  // URLにサイトがある場合はそれを使用
  if (urlSites.length > 0) {
    defaultValues.searchSites = urlSites;
  }

  // URLパラメータから読み込んだ場合のみ詳細オプションを自動展開
  if (
    (urlKeywords.length > 0 || urlSites.length > 0) &&
    searchParams.get("isAdvancedSearchEnabled") !== "false"
  ) {
    defaultValues.isAdvancedSearchEnabled = true;
  }

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = (data: SearchFormData) => {
    const {
      ownerName,
      ownerAddress,
      additionalKeywords,
      isAdvancedSearchEnabled,
    } = data;

    if (
      ownerName.trim() ||
      ownerAddress?.trim() ||
      (isAdvancedSearchEnabled && additionalKeywords.length > 0)
    ) {
      startTransition(() => {
        const params = new URLSearchParams();

        // 詳細オプションが有効な場合のみ追加キーワードを含める
        if (isAdvancedSearchEnabled) {
          additionalKeywords.forEach((keyword, index) => {
            params.set(`additionalKeywords[${index}][value]`, keyword.value);
            params.set(
              `additionalKeywords[${index}][matchType]`,
              keyword.matchType
            );
          });
        }

        if (ownerName.trim()) {
          params.set("ownerName", ownerName.trim());
          params.set("ownerNameMatchType", data.ownerNameMatchType);
        }

        if (ownerAddress?.trim()) {
          params.set("ownerAddress", ownerAddress.trim());
          params.set("ownerAddressMatchType", data.ownerAddressMatchType);
        }

        // 詳細オプションが有効な場合のみ検索対象サイトを含める
        if (isAdvancedSearchEnabled && data.searchSites.length > 0) {
          data.searchSites.forEach((site, index) => {
            params.set(`searchSites[${index}]`, site);
          });
          params.set("siteSearchMode", data.siteSearchMode);
        }

        // 詳細オプションの状態を保存
        if (isAdvancedSearchEnabled) {
          params.set("isAdvancedSearchEnabled", "true");
        }

        if (data.period && data.period !== "all") {
          params.set("period", data.period);
        }

        router.push(`/projects/${projectId}/${ownerId}?${params.toString()}`, {
          scroll: false,
        });
      });
    }
  };

  const watchedIsAdvancedSearchEnabled = form.watch("isAdvancedSearchEnabled");
  const ownerName = form.watch("ownerName");
  const ownerAddress = form.watch("ownerAddress");
  const additionalKeywords = form.watch("additionalKeywords");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-3xl mx-auto "
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-sm text-muted-foreground whitespace-nowrap w-24">
                        所有者名:
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="所有者名を入力..."
                          className="h-10 text-base border-border/50 focus:border-foreground transition-colors"
                        />
                      </FormControl>
                    </div>
                    <FormField
                      control={form.control}
                      name="ownerNameMatchType"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-4 ml-28">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="exact"
                                  id="ownerName-exact"
                                />
                                <Label
                                  htmlFor="ownerName-exact"
                                  className="text-sm cursor-pointer"
                                >
                                  完全一致
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="partial"
                                  id="ownerName-partial"
                                />
                                <Label
                                  htmlFor="ownerName-partial"
                                  className="text-sm cursor-pointer"
                                >
                                  部分一致
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerAddress"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-sm text-muted-foreground whitespace-nowrap w-24">
                        所有者住所:
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="所有者住所を入力..."
                          className="h-10 text-base border-border/50 focus:border-foreground transition-colors"
                        />
                      </FormControl>
                    </div>
                    <FormField
                      control={form.control}
                      name="ownerAddressMatchType"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-4 ml-28">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="exact"
                                  id="ownerAddress-exact"
                                />
                                <Label
                                  htmlFor="ownerAddress-exact"
                                  className="text-sm cursor-pointer"
                                >
                                  完全一致
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="partial"
                                  id="ownerAddress-partial"
                                />
                                <Label
                                  htmlFor="ownerAddress-partial"
                                  className="text-sm cursor-pointer"
                                >
                                  部分一致
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="px-2">
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">
                    検索期間:
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="text-sm cursor-pointer">
                          全期間
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="last_6_months"
                          id="last_6_months"
                        />
                        <Label
                          htmlFor="last_6_months"
                          className="text-sm cursor-pointer"
                        >
                          半年
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="last_year" id="last_year" />
                        <Label
                          htmlFor="last_year"
                          className="text-sm cursor-pointer"
                        >
                          1年
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="last_3_years"
                          id="last_3_years"
                        />
                        <Label
                          htmlFor="last_3_years"
                          className="text-sm cursor-pointer"
                        >
                          3年
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="last_5_years"
                          id="last_5_years"
                        />
                        <Label
                          htmlFor="last_5_years"
                          className="text-sm cursor-pointer"
                        >
                          5年
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="last_10_years"
                          id="last_10_years"
                        />
                        <Label
                          htmlFor="last_10_years"
                          className="text-sm cursor-pointer"
                        >
                          10年
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="px-2 space-y-3">
            <FormField
              control={form.control}
              name="isAdvancedSearchEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="text-sm text-muted-foreground">
                    詳細オプション
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchedIsAdvancedSearchEnabled && (
              <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/10">
                <FormField
                  control={form.control}
                  name="additionalKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">
                        追加キーワード
                      </FormLabel>
                      <FormControl>
                        <TagInputElegant
                          keywords={field.value}
                          onChange={field.onChange}
                          placeholder="追加キーワードを入力してEnter"
                          className=""
                          defaultKeywords={
                            searchFormDefaults.additionalKeywords
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="text-sm text-muted-foreground">
                    検索対象サイト
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="siteSearchMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4 mb-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="any" id="site-any" />
                              <Label
                                htmlFor="site-any"
                                className="text-sm cursor-pointer"
                              >
                                すべて検索
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="specific"
                                id="site-specific"
                              />
                              <Label
                                htmlFor="site-specific"
                                className="text-sm cursor-pointer"
                              >
                                指定サイトのみ
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="exclude"
                                id="site-exclude"
                              />
                              <Label
                                htmlFor="site-exclude"
                                className="text-sm cursor-pointer"
                              >
                                指定サイト除外
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="searchSites"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={
                              form.watch("siteSearchMode") === "any"
                                ? "ドメインを入力してEnter（例: example.com）"
                                : form.watch("siteSearchMode") === "specific"
                                ? "検索したいドメインを入力"
                                : "除外したいドメインを入力"
                            }
                            className=""
                            defaultTags={searchFormDefaults.searchSites}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12"
            disabled={
              isPending ||
              isSearching ||
              (!ownerName?.trim() &&
                !ownerAddress?.trim() &&
                (!form.watch("isAdvancedSearchEnabled") ||
                  additionalKeywords.length === 0))
            }
          >
            {isPending || isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                検索中...
              </>
            ) : (
              "検索"
            )}
          </Button>

          {/* 外部リンクボタン */}
          {ownerName?.trim() && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-[#1877F2] hover:bg-[#1864C9] text-white w-full"
                asChild
              >
                <Link
                  href={`https://www.facebook.com/search/top?q=${encodeURIComponent(
                    ownerName
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
                    ownerName
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
                    if (e.button === 1) {
                      e.preventDefault();
                      if (ownerName) {
                        navigator.clipboard.writeText(ownerName);
                        toast.success("名前をクリップボードにコピーしました");
                      }
                    }
                  }}
                  onClick={() => {
                    if (ownerName) {
                      navigator.clipboard.writeText(ownerName);
                      toast.success("名前をクリップボードにコピーしました");
                    }
                  }}
                >
                  <span className="flex items-center justify-center gap-1">
                    Eight
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
