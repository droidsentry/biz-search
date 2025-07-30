/**
 * 不動産住所から号室番号と地番を抽出する
 * @param propertyAddress 不動産住所
 * @returns { roomNumber: string, landNumber: string }
 */
export function extractRoomNumber(propertyAddress: string): { roomNumber: string; landNumber: string } {
  let roomNumber = "";
  let landNumber = "";
  
  if (!propertyAddress) {
    return { roomNumber, landNumber };
  }

  // 全角数字を半角に変換する関数
  const toHalfWidth = (str: string) => {
    return str.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };
  
  // 住所を正規表現でパース（最後の数字部分を探す）
  // パターン1: 「数字-数字」形式（例：１２－３８、12-38）
  // パターン2: 「数字－数字」形式（例：１５－１９－２）
  const patterns = [
    /^(.+?)([０-９\d]+[-－][０-９\d]+(?:[-－][０-９\d]+)*)$/,  // 末尾が「数字-数字」形式
    /^(.+?)([０-９\d]{3,})$/  // 末尾が3桁以上の数字のみ
  ];
  
  let matched = false;
  for (const pattern of patterns) {
    const match = propertyAddress.match(pattern);
    if (match) {
      const basePart = match[1];
      const numberPart = match[2];
      
      // 全角数字を半角に変換
      const numberPartHalf = toHalfWidth(numberPart);
      
      // 「-」で始まる場合は取り除く
      const cleanedNumber = numberPartHalf.replace(/^[-－]+/, '');
      
      // 数字とハイフンのみで構成されているか確認
      if (/^[\d-]+$/.test(cleanedNumber)) {
        // 最後のハイフン以降を号室番号とする
        const lastDashMatch = cleanedNumber.match(/[-](\d+)$/);
        if (lastDashMatch && lastDashMatch[1].length >= 1) {
          roomNumber = lastDashMatch[1];
          landNumber = basePart + cleanedNumber.substring(0, cleanedNumber.lastIndexOf('-'));
        } else if (/^\d{3,}$/.test(cleanedNumber)) {
          // ハイフンがなく3桁以上の数字の場合
          roomNumber = cleanedNumber;
          landNumber = basePart.trim();
        } else {
          landNumber = propertyAddress;
        }
        matched = true;
        break;
      }
    }
  }
  
  if (!matched) {
    // パターンにマッチしない場合は全体を地番とする
    landNumber = propertyAddress;
  }

  return { roomNumber, landNumber };
}