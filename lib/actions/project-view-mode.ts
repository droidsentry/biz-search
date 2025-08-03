'use server';

import { cookies } from 'next/headers';

const VIEW_MODE_COOKIE = 'project_view_mode';

export type ViewMode = 'grid' | 'table';

/**
 * サーバーサイドでViewModeを取得
 */
export async function getViewMode(): Promise<ViewMode> {
  const cookieStore = await cookies();
  const viewMode = cookieStore.get(VIEW_MODE_COOKIE)?.value as ViewMode | undefined;
  
  // 有効な値でない場合はデフォルト値を返す
  if (viewMode !== 'grid' && viewMode !== 'table') {
    return 'grid';
  }
  
  return viewMode;
}