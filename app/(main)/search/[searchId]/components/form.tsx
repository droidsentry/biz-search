'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "./tag-input";
import { TagInputElegant } from "./tag-input-elegant";
import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from "@/lib/constants/google-custom-search";
import { prefectures } from "@/lib/data/prefectures";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  MoreHorizontalIcon,
  SaveIcon,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { useGoogleCustomSearch } from "@/lib/swr/google-custom-search";
import { useEffect, useState } from "react";
import { SearchPatternFormModal } from "./search-pattern-form-modal";
import { SearchPatternDeleteModal } from "./search-pattern-delete-modal";

export default function GoogleCustomSearchForm({ searchId }: { searchId: string }) {
  const isNewSearch = searchId === "create";
  const [mode, setMode] = useState<"sidebar" | "full">("full");
  const [googleCustomSearchPattern, setGoogleCustomSearchPattern] = useState<GoogleCustomSearchPattern>();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const form = useForm<GoogleCustomSearchPattern>({
    resolver: zodResolver(googleCustomSearchPatternSchema),
    // mode: "onChange",
    defaultValues: DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN,
    });
  const handleSearch = async (formData: GoogleCustomSearchPattern) => {
      console.log("formData", formData);
      setGoogleCustomSearchPattern(formData);
  }
  const {data, isLoading, isValidating} = useGoogleCustomSearch(googleCustomSearchPattern);

  useEffect(() => {
    if (data) {
      setMode("sidebar");
    } else {
      setMode("full");
    }
  }, [data]);

  
  const searchPatternName = form.watch("searchPatternName");
  const searchPatternDescription = form.watch("searchPatternDescription");
  const advancedEnabled = form.watch("googleCustomSearchParams.isAdvancedSearchEnabled");
  console.log("advancedEnabled", advancedEnabled);
  const defaultAdditionalKeywords =
  DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN.googleCustomSearchParams.additionalKeywords;
  const defaultExcludeKeywords =
  DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN.googleCustomSearchParams.excludeKeywords;
  const defaultSites = DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN.googleCustomSearchParams.searchSites;

  return (
<>
      <form
        onSubmit={form.handleSubmit(handleSearch, (errors) => {
          console.log("errors", errors);
        })}
        className={styles(mode).form}
      >
        {/* 戻るボタン（フル版のみ） */}
        {mode === "full" && (
          <div className="flex w-full bg-bg-100 h-12 mx-auto md:h-24 md:items-end">
            <Button
              variant="ghost"
              size="sm"
              asChild
              onClick={() => form.reset()}
            >
              <Link
                href="/customer-searches"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 size-4" />
                戻る
              </Link>
            </Button>
          </div>
        )}

        {/* ヘッダーとパターン情報セクション */}
        <div className={styles(mode).headerSection}>
          <div className={styles(mode).headerContainer}>
            <div className="flex-1 min-w-0">
              <h1 className={styles(mode).headerTitle}>{searchPatternName}</h1>
              <p className={styles(mode).headerDescription}>
                {isNewSearch
                  ? mode === "sidebar"
                    ? "検索パターン名を決めて保存できます。"
                    : "検索条件を設定して、結果を確認後に保存できます"
                  : searchPatternDescription || ""}
              </p>
            </div>
            {isNewSearch && mode === "sidebar" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {}}
              >
                <SaveIcon className="size-5" />
              </Button>
            ) : (
              !isNewSearch && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditModal?.(true)}>
                      <Edit2 className="mr-2 size-4" />
                      設定を更新
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSaveModal?.(true)}>
                      <SaveIcon className="mr-2 size-4" />
                      名前をつけて保存
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteModal?.(true)}
                      variant="destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        </div>

        {/* 基本情報 */}
        <div className={styles(mode).basicInfoSection}>
          {mode === "full" && (
            <h3 className={styles(mode).sectionTitle}>基本情報（AND検索）</h3>
          )}

          {/* 顧客氏名 */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="googleCustomSearchParams.customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="relative">
                    顧客氏名
                    <span className="text-destructive">*</span>
                    {mode === "full" && (
                      <FormMessage className="absolute top-1/2 right-1 -translate-y-1/2" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="例: 山田太郎"
                        className={styles(mode).input}
                        {...field}
                        value={field.value || ""}
                      />
                      {mode === "full" && (
                        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      )}
                    </div>
                  </FormControl>
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
                      className={styles(mode).radioGroup}
                    >
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="exact" className="peer" />
                        </FormControl>
                        <FormLabel className={styles(mode).radioLabel}>
                          完全一致
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="partial" className="peer" />
                        </FormControl>
                        <FormLabel className={styles(mode).radioLabel}>
                          部分一致
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          {/* 住所 */}
          <div className="space-y-2">
            <Label className="relative">
              住所{mode === "full" && "（任意）"}
              {mode === "full" && (
                <FormMessage className="absolute top-1/2 right-1 -translate-y-1/2" />
              )}
            </Label>
            <div className={styles(mode).addressGrid}>
              {/* 都道府県 */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.prefecture"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={styles(mode).selectTrigger}>
                            <SelectValue
                              placeholder={
                                mode === "sidebar"
                                  ? "都道府県"
                                  : "都道府県を選択"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {prefectures.map((pref, index) => (
                              <SelectItem key={index} value={pref}>
                                {pref}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.prefectureExactMatch"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className={styles(mode).radioGroup}
                        >
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value="exact" className="peer" />
                            </FormControl>
                            <FormLabel className={styles(mode).radioLabel}>
                              {mode === "full" ? "完全一致" : "完全"}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem
                                value="partial"
                                className="peer"
                              />
                            </FormControl>
                            <FormLabel className={styles(mode).radioLabel}>
                              {mode === "full" ? "部分一致" : "部分"}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {/* 市区町村以降 */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="googleCustomSearchParams.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder={
                            mode === "sidebar"
                              ? "市区町村以降"
                              : "例: 東京都港区赤坂1-1-1"
                          }
                          className={styles(mode).input}
                          {...field}
                        />
                      </FormControl>
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
                          className={styles(mode).radioGroup}
                        >
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value="exact" className="peer" />
                            </FormControl>
                            <FormLabel className={styles(mode).radioLabel}>
                              {mode === "full" ? "完全一致" : "完全"}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem
                                value="partial"
                                className="peer"
                              />
                            </FormControl>
                            <FormLabel className={styles(mode).radioLabel}>
                              {mode === "full" ? "部分一致" : "部分"}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 高度な検索オプション*/}
        <div className="space-y-0">
          {/* トグル付きヘッダー */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-t-lg border border-b-0">
            <div className="flex items-center gap-2">
              <Settings2
                className={cn(
                  "text-muted-foreground",
                  mode === "sidebar" ? "size-4" : "size-5"
                )}
              />
              <h3
                className={cn(
                  "font-medium",
                  mode === "sidebar" ? "text-sm" : "text-base"
                )}
              >
                {mode === "full" ? "高度な検索オプション" : "詳細オプション"}
              </h3>
              <span
                className={cn(
                  "text-muted-foreground",
                  mode === "sidebar" ? "text-xs" : "text-sm"
                )}
              >
                {advancedEnabled ? "有効" : "無効"}
              </span>
            </div>
            <FormField
              control={form.control}
              name="googleCustomSearchParams.isAdvancedSearchEnabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="高度な検索オプションの切り替え"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Accordionコンテンツ */}
          <Accordion
            type="single"
            collapsible
            disabled={!advancedEnabled}
            className="border border-t-0 rounded-b-lg overflow-hidden bg-muted/50"
          >
            <AccordionItem value="item-2" className="border-0">
              <AccordionTrigger
                className={cn(
                  "px-4 py-3 hover:no-underline",
                  "bg-muted/50 dark:bg-muted/50",
                  "transition-all duration-200",
                  !advancedEnabled && "opacity-50 cursor-not-allowed",
                  "[&[data-state=open]]:bg-muted/50 dark:[&[data-state=open]]:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    !advancedEnabled && "text-muted-foreground"
                  )}
                >
                  {advancedEnabled
                    ? "クリックして設定を展開"
                    : "トグルをONにして有効化"}
                </span>
              </AccordionTrigger>
              <AccordionContent
                className={cn(
                  "bg-muted/50 px-4 pb-4 pt-2",
                  "transition-all duration-200",
                  !advancedEnabled && "opacity-50 pointer-events-none"
                )}
              >
                {/* 追加キーワード */}
                <div className="space-y-3">
                  <Label className={styles(mode).label}>
                    追加キーワード{mode === "full" && "（任意）"}
                  </Label>

                  <FormField
                    control={form.control}
                    name="googleCustomSearchParams.additionalKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TagInputElegant
                            keywords={field.value || []}
                            onChange={field.onChange}
                            placeholder={
                              mode === "sidebar"
                                ? "役職など"
                                : "会社名、役職など"
                            }
                            defaultKeywords={defaultAdditionalKeywords}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleCustomSearchParams.additionalKeywordsSearchMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className={cn(
                              "mt-2",
                              mode === "sidebar" && "flex gap-3"
                            )}
                          >
                            <div
                              className={
                                mode === "sidebar" ? "flex gap-3" : "flex gap-6"
                              }
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem
                                    value="and"
                                    className="peer"
                                  />
                                </FormControl>
                                <FormLabel className={styles(mode).radioLabel}>
                                  {mode === "sidebar"
                                    ? "AND"
                                    : "すべてを含む（AND）"}
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="or" className="peer" />
                                </FormControl>
                                <FormLabel className={styles(mode).radioLabel}>
                                  {mode === "sidebar"
                                    ? "OR"
                                    : "いずれかを含む（OR）"}
                                </FormLabel>
                              </FormItem>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Separator className="my-4" />

                  <Label className={styles(mode).label}>
                    除外キーワード{mode === "full" && "（任意）"}
                  </Label>

                  <FormField
                    control={form.control}
                    name="googleCustomSearchParams.excludeKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TagInputElegant
                            keywords={field.value || []}
                            onChange={field.onChange}
                            placeholder={
                              mode === "sidebar"
                                ? "東京都"
                                : "東京都、大阪府など"
                            }
                            defaultKeywords={defaultExcludeKeywords}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Separator className="my-4" />
                  {/* 検索対象サイト */}
                  <Label className={styles(mode).label}>検索対象サイト</Label>

                  <FormField
                    control={form.control}
                    name="googleCustomSearchParams.searchSites"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TagInput
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder={
                              mode === "sidebar"
                                ? "ドメイン"
                                : "追加するドメインを入力（例: example.com）"
                            }
                            defaultTags={defaultSites}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleCustomSearchParams.siteSearchMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className={cn("mt-4", mode === "sidebar" && "mt-2")}
                          >
                            <div className="flex gap-6">
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem
                                    value="any"
                                    className="peer"
                                  />
                                </FormControl>
                                <FormLabel className={styles(mode).radioLabel}>
                                  {mode === "sidebar"
                                    ? "全て"
                                    : "すべてのサイト"}
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem
                                    value="specific"
                                    className="peer"
                                  />
                                </FormControl>
                                <FormLabel className={styles(mode).radioLabel}>
                                  {mode === "sidebar"
                                    ? "指定"
                                    : "指定サイトのみ"}
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem
                                    value="exclude"
                                    className="peer"
                                  />
                                </FormControl>
                                <FormLabel className={styles(mode).radioLabel}>
                                  {mode === "sidebar"
                                    ? "除外"
                                    : "指定サイトを除外"}
                                </FormLabel>
                              </FormItem>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Button
          type="submit"
          size={styles(mode).submitButtonSize}
          className={styles(mode).submitButton}
          disabled={isValidating}
        >
          {isLoading ? (
            <>
              <div
                className={cn(
                  "mr-2 animate-spin rounded-full border-2 border-white border-t-transparent",
                  mode === "sidebar" ? "size-3" : "size-4"
                )}
              />
              検索中...
            </>
          ) : mode === "sidebar" ? (
            "再検索"
          ) : (
            "検索"
          )}
        </Button>
      </form>

      {/* 保存モーダル */}
      <SearchPatternFormModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentName={searchPatternName}
        currentDescription={searchPatternDescription}
        mode="create"
      />
      {/* 編集モーダル */}
      <SearchPatternFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentName={searchPatternName}
        currentDescription={searchPatternDescription}
        mode="edit"
      />
      {/* 削除モーダル */}
      <SearchPatternDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  )
}

 // スタイル定義
  const styles = (mode: "sidebar" | "full") => ({
    form: cn(
      "w-full",
      mode === "sidebar" ? "space-y-4" : "max-w-2xl space-y-6"
    ),
    headerSection: cn(
      mode === "sidebar" ? "space-y-3 pb-3 border-b" : "space-y-4"
    ),
    headerContainer: cn(
      "flex items-start justify-between",
      mode === "sidebar" ? "gap-2" : "gap-4"
    ),
    headerTitle: cn(
      mode === "sidebar" ? "font-medium truncate" : "text-2xl font-light"
    ),
    headerDescription: cn(
      "text-muted-foreground",
      mode === "sidebar"
        ? "text-xs mt-1 truncate"
        : "mt-1 text-sm text-muted-foreground"
    ),
    basicInfoSection: cn(
      "space-y-4",
      mode === "sidebar"
        ? ""
        : "rounded-lg border bg-muted/50 p-6 dark:border-muted dark:bg-muted/50"
    ),
    sectionTitle: cn(
      "font-medium",
      mode === "sidebar" ? "text-sm" : "text-base"
    ),
    label: cn(mode === "sidebar" ? "text-sm" : ""),
    input: cn(mode === "sidebar" ? "h-9 text-sm" : "pr-10"),
    radioGroup: cn("flex", mode === "sidebar" ? "gap-4 text-xs" : "gap-6"),
    radioLabel: cn(
      "cursor-pointer text-muted-foreground",
      mode === "sidebar" ? "text-xs" : "text-sm",
      "peer-data-[state=checked]:text-foreground"
    ),
    addressGrid: cn(
      "grid",
      mode === "sidebar" ? "grid-cols-2 gap-2" : "gap-3 md:grid-cols-2"
    ),
    selectTrigger: cn(mode === "sidebar" ? "h-9 text-sm" : ""),
    advancedSection: cn(
      "space-y-4",
      mode === "sidebar" ? "" : "rounded-lg bg-muted/50 p-4 dark:bg-muted"
    ),
    advancedButton: cn(
      "flex items-center text-sm font-medium",
      mode === "sidebar"
        ? "w-full justify-between"
        : "gap-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
    ),
    submitButton: cn("w-full"),
    submitButtonSize: (mode === "sidebar" ? "sm" : "lg") as "sm" | "lg",
  })