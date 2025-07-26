interface PropertyOwner {
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
  let isCoOwnerMode = false  // 共有者モードかどうか
  const coOwners: { address: string, names: string[] } = { address: '', names: [] }  // 共有者情報
  
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
    // 都道府県名から始まる住所を検出
    const addressMatch = line.match(/((?:東京都|北海道|(?:京都|大阪)府|(?:神奈川|埼玉|千葉|愛知|兵庫|福岡|静岡|茨城|広島|新潟|宮城|長野|岐阜|栃木|群馬|岡山|福島|三重|熊本|鹿児島|沖縄|滋賀|山口|愛媛|長崎|奈良|青森|岩手|大分|石川|山形|宮崎|富山|秋田|香川|和歌山|山梨|佐賀|福井|徳島|高知|島根|鳥取)県)[^\s]+)\s+所有者一覧表/)
    if (addressMatch) {
      currentPropertyAddress = addressMatch[1].trim()
      console.log('物件住所検出:', currentPropertyAddress)
    }
    
    // 共有者モードの判定
    if (line.includes('共') && line.includes('有') && line.includes('者')) {
      isCoOwnerMode = true
      console.log('共有者モードに切り替え')
    }
    
    // データ行の抽出（┃で囲まれた行）
    // ヘッダー行（「住所」「氏名」を含む）をスキップ
    const isHeaderRow = line.includes('住') && line.includes('所') && line.includes('氏') && line.includes('名')
    
    // データ行の判定：┃と│を含み、ヘッダー行でない、罫線でない
    if (line.includes('┃') && line.includes('│') && !isHeaderRow && !line.includes('━') && !line.includes('─')) {
      console.log('データ行候補:', line)
      
      // 共有者モードの場合は3列パターン
      if (isCoOwnerMode) {
        const coOwnerMatch = line.match(/┃([^┃│]+)│([^┃│]+)│([^┃│]+)┃/)
        if (coOwnerMatch) {
          const address = coOwnerMatch[1].trim()
          const share = coOwnerMatch[2].trim()  // 持分（使用しない）
          const name = coOwnerMatch[3].trim()
          
          console.log('共有者データ抽出:', { address, share, name })
          
          // 共有者情報を収集
          if (!coOwners.address && address) {
            coOwners.address = address
          }
          if (name) {
            coOwners.names.push(name)
          }
          continue
        }
      }
      
      // 通常の2列パターン
      const patterns = [
        /┃([^┃│]+)│([^┃│]+)┃/,
        /┃\s*([^┃│]+)\s*│\s*([^┃│]+)\s*┃/,
        /┃(.+?)│(.+?)┃/
      ]
      
      let matched = false
      for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match) {
          let ownerAddress = match[1].trim()
          let ownerName = match[2].trim()
          
          // 氏名が空で住所のみの場合は、前の行の住所の続きの可能性
          if (ownerAddress && !ownerName) {
            console.log('住所の続きの行と判断してスキップ:', line)
            continue
          }
          
          console.log('初期データ抽出:', { ownerAddress, ownerName })
          
          // 住所と氏名の続きを収集
          const ownerAddressLines = [ownerAddress]
          const ownerNameLines = [ownerName]
          let j = i + 1
          
          // まず住所の続きを確認
          while (j < lines.length) {
            const nextLine = lines[j].trim()
            console.log(`確認中の行 (${j}):`, nextLine)
            
            // 住所の続き行の判定：住所部分にのみテキストがある
            if (nextLine.includes('┃') && nextLine.includes('│') && !nextLine.includes('━') && !nextLine.includes('─')) {
              const continueMatch = nextLine.match(/┃([^┃│]+)│([^┃│]*)┃/)
              if (continueMatch) {
                const additionalAddress = continueMatch[1].trim()
                const rightSide = continueMatch[2].trim()
                
                // 住所の続き（右側が空）
                if (additionalAddress && !rightSide) {
                  console.log('住所の続き検出:', additionalAddress)
                  ownerAddressLines.push(additionalAddress)
                  i = j // ループカウンタを更新
                  j++
                  continue
                }
                // それ以外の場合は住所の続きではない
                break
              }
            }
            break
          }
          
          // 住所を結合
          ownerAddress = ownerAddressLines.join('')
          
          // 次に氏名の続きを確認
          while (j < lines.length) {
            const nextLine = lines[j].trim()
            console.log(`氏名確認中の行 (${j}):`, nextLine)
            
            // 氏名の続き行の判定
            if (nextLine.includes('┃') && nextLine.includes('│') && !nextLine.includes('━') && !nextLine.includes('─')) {
              // 続きの行のパターンマッチ
              const continueMatch = nextLine.match(/┃\s*│(.+?)┃/)
              if (continueMatch) {
                const additionalName = continueMatch[1].trim()
                if (additionalName) {
                  console.log('氏名の続き検出:', additionalName)
                  ownerNameLines.push(additionalName)
                  i = j // ループカウンタを更新
                  j++
                  continue
                }
              }
            }
            // 氏名の続きではないので終了
            break
          }
          
          // 複数行の氏名を処理
          if (ownerNameLines.length > 1) {
            // 法人の場合：会社名 + 会社法人等番号を1行に
            const companyName = ownerNameLines[0]
            const additionalInfo = ownerNameLines.slice(1).join('')
              .replace(/\s+/g, '')  // 余分なスペースを削除
              .replace(/会社法人等番号/, '　会社法人等番号　')  // 前後にスペース追加
            
            ownerName = companyName + additionalInfo
          } else {
            // 個人の場合：そのまま
            ownerName = ownerNameLines[0]
          }
          console.log('最終的な氏名:', ownerName)
          
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
  
  // 共有者情報がある場合は最後に追加
  if (isCoOwnerMode && coOwners.address && coOwners.names.length > 0) {
    console.log('共有者情報をまとめて追加:', coOwners)
    properties.push({
      recordDate: currentRecordDate,
      propertyAddress: currentPropertyAddress,
      ownerName: coOwners.names.join('、'),  // 複数の名前を「、」で結合
      ownerAddress: coOwners.address
    })
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