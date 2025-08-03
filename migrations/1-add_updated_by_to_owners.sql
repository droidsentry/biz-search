-- ownersテーブルにupdated_byフィールドを追加

-- 1. updated_byカラムを追加（デフォルト値としてauth.uid()を設定）
ALTER TABLE public.owners 
ADD COLUMN updated_by uuid DEFAULT auth.uid();

-- 2. 外部キー制約を追加
ALTER TABLE public.owners
ADD CONSTRAINT owners_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 注：更新時のupdated_byの設定はフロントエンド側で行う
-- 既存のupdate_owners_updated_atトリガーはupdated_atのみを更新する