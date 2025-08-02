-- アプリケーション設定テーブル
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLSの有効化
alter table public.app_settings enable row level security;

-- RLSポリシー（全員閲覧可能、システムオーナーのみ編集可能）
create policy "Everyone can view app settings"
  on public.app_settings for select
  using (true);

create policy "Only system owners can manage app settings"
  on public.app_settings for all
  using (is_system_owner());

-- 初期データの投入
insert into public.app_settings (key, value, description) values
  ('search_form_defaults', '{
    "ownerName": "",
    "ownerNameMatchType": "exact",
    "ownerAddress": "",
    "ownerAddressMatchType": "partial",
    "period": "all",
    "isAdvancedSearchEnabled": false,
    "additionalKeywords": [
      {
        "value": "代表取締役",
        "matchType": "exact"
      }
    ],
    "searchSites": ["facebook.com", "linkedin.com", "nikkei.com"],
    "siteSearchMode": "any"
  }'::jsonb, '検索フォームのデフォルト値'),
  
  ('google_custom_search_pattern', '{
    "searchPatternName": "新規検索パターン",
    "searchPatternDescription": "",
    "googleCustomSearchParams": {
      "customerName": "",
      "customerNameExactMatch": "exact",
      "address": "",
      "addressExactMatch": "partial",
      "dateRestrict": "all",
      "isAdvancedSearchEnabled": false,
      "additionalKeywords": [
        {
          "value": "代表取締役",
          "matchType": "partial"
        }
      ],
      "searchSites": ["facebook.com", "linkedin.com", "nikkei.com"],
      "siteSearchMode": "any"
    }
  }'::jsonb, 'Google Custom Searchのデフォルトパターン');

-- 更新時のタイムスタンプ自動更新
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_app_settings_updated_at
  before update on public.app_settings
  for each row execute function update_updated_at_column();