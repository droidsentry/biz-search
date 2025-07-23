import { prefectures } from '../data/prefectures';

/**
 * 住所を都道府県市区町村まで（東京都の場合は区まで）に加工する
 * @param address 入力住所
 * @returns 加工された住所
 */
export function formatAddressToCityLevel(address: string): string {
  if (!address) return '';

  // 都道府県リストから「選択しない」を除外
  const validPrefectures = prefectures.filter(pref => pref !== '選択しない');
  
  // 都道府県を検出
  let prefecture = '';
  let remainingAddress = address;
  
  for (const pref of validPrefectures) {
    if (address.startsWith(pref)) {
      prefecture = pref;
      remainingAddress = address.substring(pref.length);
      break;
    }
  }
  
  // 東京都の場合は区まで抽出
  if (prefecture === '東京都') {
    // 23区のパターン
    const tokyoWardPattern = /^(千代田|中央|港|新宿|文京|台東|墨田|江東|品川|目黒|大田|世田谷|渋谷|中野|杉並|豊島|北|荒川|板橋|練馬|足立|葛飾|江戸川)区/;
    const wardMatch = remainingAddress.match(tokyoWardPattern);
    
    if (wardMatch) {
      return prefecture + wardMatch[0];
    }
    
    // 市部のパターン（八王子市、立川市など）
    const cityPattern = /^[^市]+市/;
    const cityMatch = remainingAddress.match(cityPattern);
    
    if (cityMatch) {
      return prefecture + cityMatch[0];
    }
    
    // 郡部のパターン（西多摩郡など）
    const gunPattern = /^[^郡]+郡[^町村]+[町村]/;
    const gunMatch = remainingAddress.match(gunPattern);
    
    if (gunMatch) {
      return prefecture + gunMatch[0];
    }
  }
  
  // その他の都道府県の場合
  if (prefecture) {
    // 市のパターン
    const cityPattern = /^[^市]+市/;
    const cityMatch = remainingAddress.match(cityPattern);
    
    if (cityMatch) {
      // 市の後に区がある場合（政令指定都市）
      const remainingAfterCity = remainingAddress.substring(cityMatch[0].length);
      const wardPattern = /^[^区]+区/;
      const wardMatch = remainingAfterCity.match(wardPattern);
      
      if (wardMatch) {
        return prefecture + cityMatch[0] + wardMatch[0];
      }
      return prefecture + cityMatch[0];
    }
    
    // 郡のパターン
    const gunPattern = /^[^郡]+郡[^町村]+[町村]/;
    const gunMatch = remainingAddress.match(gunPattern);
    
    if (gunMatch) {
      return prefecture + gunMatch[0];
    }
  }
  
  // 都道府県が省略されている場合の処理
  if (!prefecture) {
    // 政令指定都市のリスト
    const majorCities = [
      '札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市', '相模原市',
      '新潟市', '静岡市', '浜松市', '名古屋市', '京都市', '大阪市', '堺市',
      '神戸市', '岡山市', '広島市', '北九州市', '福岡市', '熊本市'
    ];
    
    // 政令指定都市の検出
    for (const city of majorCities) {
      if (address.startsWith(city)) {
        const remainingAfterCity = address.substring(city.length);
        const wardPattern = /^[^区]+区/;
        const wardMatch = remainingAfterCity.match(wardPattern);
        
        if (wardMatch) {
          return city + wardMatch[0];
        }
        return city;
      }
    }
    
    // その他の市
    const cityPattern = /^[^市]+市/;
    const cityMatch = address.match(cityPattern);
    
    if (cityMatch) {
      const remainingAfterCity = address.substring(cityMatch[0].length);
      const wardPattern = /^[^区]+区/;
      const wardMatch = remainingAfterCity.match(wardPattern);
      
      if (wardMatch) {
        return cityMatch[0] + wardMatch[0];
      }
      return cityMatch[0];
    }
  }
  
  // デフォルトは元の住所を返す
  return address;
}