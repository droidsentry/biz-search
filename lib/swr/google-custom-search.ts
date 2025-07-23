'use client';

import useSWR from "swr";
import { getCustomerInfoFromGoogleCustomSearch } from "../actions/google/custom-search";
import { generateGoogleCustomSearchParams } from "../actions/google/utils";
import { GoogleCustomSearchPattern, GoogleSearchRequestResponse } from "../types/custom-search";

interface UseGoogleSearchOptions {
  enabled?: boolean; // デフォルトでは有効
  revalidateOnFocus?: boolean; // デフォルトではフォーカス時に再検証しない
  revalidateOnReconnect?: boolean; // デフォルトでは再接続時に再検証しない
  dedupingInterval?: number; // デフォルトでは3時間 (10,800,000ms) でデータ保持
}

export function useGoogleCustomSearch({
  formData,
  options,
}:{
  formData?: GoogleCustomSearchPattern,
  options?: UseGoogleSearchOptions,
}){
  const {
    enabled = true,                // デフォルトでは有効
    revalidateOnFocus = false,     // デフォルトではフォーカス時に再検証しない
    revalidateOnReconnect = false, // デフォルトでは再接続時に再検証しない
    dedupingInterval = 3 * 60 * 60 * 1000, // 3時間 (10,800,000ms) でデータ保持
  } = options || {};  
  const GoogleSearchParams = formData ? generateGoogleCustomSearchParams(formData) : null;
  const key = formData && enabled ? ['google-search ', GoogleSearchParams] : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<GoogleSearchRequestResponse, Error>(
    key,
    () => getCustomerInfoFromGoogleCustomSearch(formData!),
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval,
      errorRetryCount: 2, // 最大2回リトライ
      errorRetryInterval: 5000, // 5秒ごとにリトライ
      keepPreviousData: true, // 新しいデータを取得中も前のデータを保持
    }
  );



  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}