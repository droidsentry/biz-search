import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

// APIから取得したタイムスタンプを日本時間に変換
export const formatToJapaneseDate = (timestamp: number = Date.now()) => {
  const formattedDate = format(timestamp, "yyyy年MM月dd日(E)", {
    locale: ja,
  });
  return formattedDate;
};

/**
 * 日付を日本時間に変換
 * @param timestamp 日付を表す数値、文字列、またはDateオブジェクト
 * @param formatString 日付のフォーマット文字列
 * @returns フォーマットされた日付文字列
 * @example
 * // 現在時刻（デフォルトフォーマット）
 * formatToJapaneseDateTime(); // 2025/01/12 12:00:00（日）
 * // タイムスタンプを指定
 * formatToJapaneseDateTime(1710393600000, "yyyy/MM/dd HH:mm:ss（E）") // 2024/01/01 00:00:00（火）
 * // Date オブジェクト
 * formatToJapaneseDateTime(new Date()); // 2025/01/12 12:00:00（日）
 * // フォーマットを指定
 * formatToJapaneseDateTime(new Date(), "yyyy/MM/dd HH:mm:ss（E）") // 2024/01/01 00:00:00（火）
 * // 日付文字列を指定
 * formatToJapaneseDateTime("2024-01-01T00:00:00Z", "yyyy/MM/dd HH:mm:ss（E）") // 2024/01/01 00:00:00（火）
 */
export const formatToJapaneseDateTime = (
  timestamp: Date | number | string = Date.now(),
  formatString = "yyyy/MM/dd HH:mm:ss（E）"
) => {
  return format(new Date(timestamp), formatString, {
    locale: ja,
  });
};