export interface PropertyOwner {
  recordDate: string      // 記録日時（PDFからの情報）
  propertyAddress: string // 物件住所（部屋番号含む）
  ownerName: string      // 所有者名
  ownerAddress: string   // 所有者住所
}

/**
 * PDFから抽出された不動産所有者情報をパースする
 * @param text PDFから抽出されたテキスト
 * @returns パース済みの所有者情報配列
 */
export function parsePropertyOwnerData(text: string): PropertyOwner[] {
  const properties: PropertyOwner[] = []
  
  console.log('=== パース開始 ===')
  console.log('入力テキスト長:', text.length)
  
  // テキストを行に分割
  const lines = text.split('\n')
  console.log('総行数:', lines.length)
  
  let currentRecordDate = ''
  let currentPropertyAddress = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 日時の抽出（例：２０２５／０６／１２　１７：４５）
    const dateMatch = line.match(/([０-９0-9]{4})[／\/]([０-９0-9]{2})[／\/]([０-９0-9]{2})\s*([０-９0-9]{2})[：:]([０-９0-9]{2})/)
    if (dateMatch) {
      // 全角数字を半角に変換
      const year = convertToHalfWidth(dateMatch[1])
      const month = convertToHalfWidth(dateMatch[2])
      const day = convertToHalfWidth(dateMatch[3])
      const hour = convertToHalfWidth(dateMatch[4])
      const minute = convertToHalfWidth(dateMatch[5])
      // ISO 8601形式に変換 (JSTとして扱う)
      currentRecordDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`
      console.log('日時検出:', currentRecordDate)
    }
    
    // 物件住所の抽出（例：東京都墨田区八広４丁目１２９－５－２０１）
    const addressMatch = line.match(/東京都[^\s]+\s+所有者一覧表/)
    if (addressMatch) {
      currentPropertyAddress = addressMatch[0].replace(/\s*所有者一覧表.*$/, '').trim()
      console.log('物件住所検出:', currentPropertyAddress)
    }
    
    // データ行の抽出（┃で囲まれた行）
    if (line.includes('┃') && !line.includes('住') && !line.includes('所') && !line.includes('氏')) {
      console.log('データ行候補:', line)
      
      // 複数の区切りパターンに対応
      const patterns = [
        /┃([^┃│]+)│([^┃│]+)┃/,
        /┃\s*([^┃│]+)\s*│\s*([^┃│]+)\s*┃/,
        /┃(.+?)│(.+?)┃/
      ]
      
      let matched = false
      for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match) {
          const ownerAddress = match[1].trim()
          const ownerName = match[2].trim()
          
          console.log('抽出成功:', { ownerAddress, ownerName })
          
          properties.push({
            recordDate: currentRecordDate,
            propertyAddress: currentPropertyAddress,
            ownerName: ownerName,
            ownerAddress: ownerAddress
          })
          matched = true
          break
        }
      }
      
      if (!matched) {
        console.log('パターンマッチ失敗')
      }
    }
  }
  
  console.log('=== パース完了 ===')
  console.log('抽出件数:', properties.length)
  console.log('抽出データ:', JSON.stringify(properties, null, 2))
  
  return properties
}

/**
 * 全角数字を半角に変換
 */
function convertToHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
  })
}

/**
 * 構造化データをテーブル形式の文字列に変換
 */
export function formatPropertyDataAsTable(data: PropertyOwner[]): string {
  if (data.length === 0) return 'データがありません'
  
  let output = `抽出件数: ${data.length}件\n\n`
  output += '物件情報一覧\n'
  output += '━'.repeat(80) + '\n\n'
  
  data.forEach((property, index) => {
    output += `【物件 ${index + 1}】\n`
    output += `記録日時: ${property.recordDate}\n`
    output += `物件住所: ${property.propertyAddress}\n`
    output += `所有者名: ${property.ownerName}\n`
    output += `所有者住所: ${property.ownerAddress}\n`
    output += '\n'
  })
  
  return output
}

/**
 * 構造化データをCSV形式に変換
 */
export function formatPropertyDataAsCSV(data: PropertyOwner[]): string {
  const headers = ['記録日時', '物件住所', '所有者名', '所有者住所']
  const rows = data.map(property => [
    property.recordDate,
    property.propertyAddress,
    property.ownerName,
    property.ownerAddress
  ])
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}

// 旧インターフェースとの互換性のため
export interface ParsedPropertyData {
  extractedAt: string
  properties: PropertyOwner[]
}