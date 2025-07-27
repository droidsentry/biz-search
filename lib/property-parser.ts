interface PropertyOwner {
  recordDate: string      // 記録日時（PDFからの情報）
  propertyAddress: string // 物件住所（部屋番号含む）
  ownerName: string      // 所有者名
  ownerAddress: string   // 所有者住所
  ownerNameWarning?: string // 所有者名の警告（文字欠損など）
  isOwnerNameCorrupted?: boolean // 所有者名が文字化けしているか
  ownerAddressWarning?: string // 所有者住所の警告（文字欠損など）
  isOwnerAddressCorrupted?: boolean // 所有者住所が文字化けしているか
  wasEarlyStop?: boolean // 早期終了フラグ（最後の1件にのみ設定）
}

/**
 * PDFから抽出された不動産所有者情報をパースする
 * @param text PDFから抽出されたテキスト
 * @param options パースオプション
 * @returns パース済みの所有者情報配列
 */
export function parsePropertyOwnerData(text: string, options?: { maxOwnersPerProperty?: number; earlyStopOnSuspicious?: boolean }): PropertyOwner[] {
  const properties: PropertyOwner[] = []
  const maxOwners = options?.maxOwnersPerProperty || Infinity
  const earlyStop = options?.earlyStopOnSuspicious ?? false
  
  console.log('=== パース開始 ===')
  console.log('入力テキスト長:', text.length)
  console.log('最大所有者数制限:', maxOwners === Infinity ? '無制限' : maxOwners)
  console.log('不正検出時の早期終了:', earlyStop)
  
  // テキストを行に分割
  const lines = text.split('\n')
  console.log('総行数:', lines.length)
  
  let currentRecordDate = ''
  let currentPropertyAddress = ''
  let isCoOwnerMode = false  // 共有者モードかどうか
  const coOwnersMap = new Map<string, string[]>()  // 住所ごとに共有者をグループ化
  const propertyOwnerCount = new Map<string, number>()  // 物件ごとの所有者数
  
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
          const share = coOwnerMatch[2].trim()  // 持分
          const name = coOwnerMatch[3].trim()
          
          console.log('共有者データ抽出:', { address, share, name })
          
          // 住所と名前がある場合は新しいエントリー
          if (address && name) {
            // 次の行が住所の続きかチェック
            let fullAddress = address
            let j = i + 1
            while (j < lines.length) {
              const nextLine = lines[j].trim()
              const nextMatch = nextLine.match(/┃([^┃│]+)│([^┃│]+)│([^┃│]+)┃/)
              if (nextMatch) {
                const nextAddress = nextMatch[1].trim()
                const nextShare = nextMatch[2].trim()
                const nextName = nextMatch[3].trim()
                
                // 住所の続き行（持分と名前が空）
                if (nextAddress && !nextShare && !nextName) {
                  fullAddress += nextAddress
                  console.log('住所の続きを結合:', fullAddress)
                  i = j // ループカウンタを更新
                  j++
                  continue
                }
              }
              break
            }
            
            // 住所ごとに共有者をグループ化
            if (!coOwnersMap.has(fullAddress)) {
              coOwnersMap.set(fullAddress, [])
            }
            coOwnersMap.get(fullAddress)!.push(name)
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
          
          // 名前の警告チェック
          const nameWarning = detectIncompleteOwnerNamePattern(ownerName)
          const isOwnerNameCorrupted = nameWarning !== undefined
          
          if (nameWarning) {
            console.log('名前警告:', nameWarning)
          }
          
          // 住所の警告チェック（住所専用のパターン検知を適用）
          const addressWarning = detectIncompleteAddressPattern(ownerAddress)
          const isOwnerAddressCorrupted = addressWarning !== undefined
          
          if (addressWarning) {
            console.log('住所警告:', addressWarning)
          }
          
          // デバッグ用：名前の詳細を出力
          const charCodes = []
          for (let i = 0; i < ownerName.length; i++) {
            charCodes.push(ownerName.charCodeAt(i))
          }
          console.log('名前の詳細:', {
            name: ownerName,
            length: ownerName.length,
            hasDoubleSpace: /\s{2,}/.test(ownerName),
            hasDoubleSpaceZenkaku: /　{2,}/.test(ownerName),
            hasDoubleSpaceMixed: /[\s　]{2,}/.test(ownerName),
            spaceCount: (ownerName.match(/\s/g) || []).length,
            zenkakuSpaceCount: (ownerName.match(/　/g) || []).length,
            nameWithoutSpaces: ownerName.replace(/[\s　]/g, ''),
            charCodes: charCodes.map(c => `0x${c.toString(16).toUpperCase()}`).join(' '),
            warning: nameWarning,
            isCorrupted: isOwnerNameCorrupted
          })
          
          // 物件ごとの所有者数をチェック
          const currentCount = propertyOwnerCount.get(currentPropertyAddress) || 0
          if (currentCount >= maxOwners) {
            console.log(`⚠️ 物件「${currentPropertyAddress}」で${maxOwners}世帯以上の所有者を検出。処理を中断します。`)
            return properties  // 早期終了
          }
          
          // 早期停止オプションが有効で、既に4世帯分ある場合（5世帯目で検出）
          if (earlyStop && currentCount >= 4) {
            console.log(`🚨 物件「${currentPropertyAddress}」で5世帯以上を検出。早期終了します（4世帯分のみ返却）。`)
            // 最後の要素に早期終了フラグを設定
            if (properties.length > 0) {
              properties[properties.length - 1].wasEarlyStop = true
            }
            return properties  // 5世帯目以降は追加せずに終了
          }
          
          properties.push({
            recordDate: currentRecordDate,
            propertyAddress: currentPropertyAddress,
            ownerName: ownerName,
            ownerAddress: ownerAddress,
            ownerNameWarning: nameWarning,
            isOwnerNameCorrupted: isOwnerNameCorrupted,
            ownerAddressWarning: addressWarning,
            isOwnerAddressCorrupted: isOwnerAddressCorrupted
          })
          
          // カウントを更新
          propertyOwnerCount.set(currentPropertyAddress, currentCount + 1)
          
          matched = true
          break
        }
      }
      
      if (!matched) {
        console.log('パターンマッチ失敗')
      }
    }
  }
  
  // 共有者情報がある場合は住所ごとにまとめて追加
  if (isCoOwnerMode && coOwnersMap.size > 0) {
    // 早期停止チェック - 既に4世帯分ある場合
    if (earlyStop && properties.length >= 4) {
      console.log(`🚨 共有者モードで5世帯以上を検出（既に${properties.length}世帯、共有者${coOwnersMap.size}件）。早期終了フラグを設定します。`)
      // 最後の要素に早期終了フラグを設定
      if (properties.length > 0) {
        properties[properties.length - 1].wasEarlyStop = true
      }
      return properties  // 共有者データは追加せずに終了
    }
    
    // 早期停止モードで、まだデータが少なく、共有者を含めて5世帯以上になる場合
    if (earlyStop && properties.length < 4 && properties.length + coOwnersMap.size >= 5) {
      console.log(`🚨 共有者モードで5世帯以上を検出（既存${properties.length}世帯 + 共有者${coOwnersMap.size}件）。${4 - properties.length}世帯分の共有者のみ処理します。`)
      // 必要な世帯数だけ処理
      let processedCount = 0
      const neededCount = 4 - properties.length
      
      for (const [address, names] of coOwnersMap) {
        if (processedCount >= neededCount) break
        
        console.log('共有者情報を追加:', { address, names })
        const combinedName = names.join('、')
        
        // 各共有者の名前もチェック
        let nameWarning: string | undefined
        let isOwnerNameCorrupted = false
        for (const name of names) {
          const warning = detectIncompleteOwnerNamePattern(name)
          if (warning) {
            nameWarning = warning + ` (共有者: ${name})`
            isOwnerNameCorrupted = true
            break
          }
        }
        
        // 住所の警告チェック
        const addressWarning = detectIncompleteAddressPattern(address)
        const isOwnerAddressCorrupted = addressWarning !== undefined
        
        properties.push({
          recordDate: currentRecordDate,
          propertyAddress: currentPropertyAddress,
          ownerName: combinedName,
          ownerAddress: address,
          ownerNameWarning: nameWarning,
          isOwnerNameCorrupted: isOwnerNameCorrupted,
          ownerAddressWarning: addressWarning,
          isOwnerAddressCorrupted: isOwnerAddressCorrupted,
          wasEarlyStop: processedCount === neededCount - 1  // 最後の1件にのみ早期終了フラグを設定
        })
        
        processedCount++
      }
      
      return properties
    }
    
    coOwnersMap.forEach((names, address) => {
      // 早期停止チェック
      if (earlyStop) {
        const currentCount = propertyOwnerCount.get(currentPropertyAddress) || 0
        if (currentCount >= 4) {
          console.log(`🚨 共有者処理中に既に4世帯分を検出。スキップします。`)
          return  // forEachの現在の反復をスキップ
        }
      }
      
      console.log('共有者情報をまとめて追加:', { address, names })
      const combinedName = names.join('、')  // 複数の名前を「、」で結合
      
      // 各共有者の名前もチェック
      let nameWarning: string | undefined
      let isOwnerNameCorrupted = false
      for (const name of names) {
        const warning = detectIncompleteOwnerNamePattern(name)
        if (warning) {
          nameWarning = warning + ` (共有者: ${name})`
          isOwnerNameCorrupted = true
          break
        }
      }
      
      // 住所の警告チェック
      const addressWarning = detectIncompleteAddressPattern(address)
      const isOwnerAddressCorrupted = addressWarning !== undefined
      
      properties.push({
        recordDate: currentRecordDate,
        propertyAddress: currentPropertyAddress,
        ownerName: combinedName,
        ownerAddress: address,
        ownerNameWarning: nameWarning,
        isOwnerNameCorrupted: isOwnerNameCorrupted,
        ownerAddressWarning: addressWarning,
        isOwnerAddressCorrupted: isOwnerAddressCorrupted
      })
      
      // カウントを更新
      const count = propertyOwnerCount.get(currentPropertyAddress) || 0
      propertyOwnerCount.set(currentPropertyAddress, count + 1)
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

/**
 * 不完全な所有者名パターンを検知
 * @param name 検証する名前
 * @returns 警告メッセージ（問題がない場合はundefined）
 */
function detectIncompleteOwnerNamePattern(name: string): string | undefined {
  // 法人の会社法人等番号パターンをチェック（正常なパターン）
  if (name.includes('会社法人等番号')) {
    return undefined // 警告なし
  }
  
  // 文字コードレベルでチェック
  const charCodes: number[] = []
  for (let i = 0; i < name.length; i++) {
    charCodes.push(name.charCodeAt(i))
  }
  
  // 不可視文字や特殊文字の検出
  const hasInvisibleChar = charCodes.some(code => {
    return (
      code === 0xEE45 || // PDFで見つかった特殊文字
      code === 0x200B || // ゼロ幅スペース
      code === 0xFFFD || // 置換文字
      (code >= 0xE000 && code <= 0xF8FF) // 私用領域
    )
  })
  
  if (hasInvisibleChar) {
    return '名前に不可視文字が含まれています（文字欠損の可能性）'
  }
  
  // 空白が2つ以上連続している場合（半角・全角問わず）
  if (/[\s　]{2,}/.test(name)) {
    return '名前に連続した空白が含まれています（文字欠損の可能性）'
  }
  
  // 複数の空白を含む短い名前（例: "佐 慎一"）
  const spaceCount = (name.match(/[\s　]/g) || []).length
  const nameWithoutSpaces = name.replace(/[\s　]/g, '')
  
  // 2つ以上の空白があり、かつ名前が短い場合
  if (spaceCount >= 2 && nameWithoutSpaces.length <= 4) {
    return '名前に複数の空白が含まれており、文字が欠損している可能性があります'
  }
  
  // 日本人の名前で一般的な長さより短い（2文字以下）かつ空白を含む
  if (nameWithoutSpaces.length <= 2 && (name.includes(' ') || name.includes('　'))) {
    return '名前が短すぎます（文字欠損の可能性）'
  }
  
  // 一般的な日本人の姓名パターンをチェック
  if (name.match(/[\u4E00-\u9FFF]/) && (name.includes(' ') || name.includes('　'))) {
    // 漢字を含み、空白も含む場合
    const parts = name.split(/[\s　]+/)
    if (parts.length === 2) {
      const [firstName, lastName] = parts
      
      // 「佐 慎一」のようなパターン（姓が1文字で名が2文字）
      if (firstName.length === 1 && lastName.length === 2) {
        // 一般的な1文字姓をチェック
        const commonSingleCharSurnames = ['関', '林', '森', '原', '堀', '辻', '菅', '岡', '南', '東', '西', '北']
        if (!commonSingleCharSurnames.includes(firstName)) {
          return `姓「${firstName}」が不完全な可能性があります（文字欠損の疑い）`
        }
      }
      // 両方1文字は疑わしい
      else if (firstName.length === 1 && lastName.length === 1) {
        return '姓名が短すぎます（文字欠損の可能性）'
      }
    }
    // 3つ以上のパーツに分かれている場合（例: "佐  慎一" → ["佐", "", "慎一"]）
    else if (parts.length >= 3) {
      // 空のパーツがある場合は文字欠損の可能性
      if (parts.some(part => part === '')) {
        return '名前に異常な空白パターンが含まれています（文字欠損の可能性）'
      }
      return '名前が複数の部分に分かれています（文字欠損の可能性）'
    }
  }
  
  return undefined
}

/**
 * 不完全な住所パターンを検知
 * @param address 検証する住所
 * @returns 警告メッセージ（問題がない場合はundefined）
 */
function detectIncompleteAddressPattern(address: string): string | undefined {
  // 文字コードレベルでチェック
  const charCodes: number[] = []
  for (let i = 0; i < address.length; i++) {
    charCodes.push(address.charCodeAt(i))
  }
  
  // 不可視文字や特殊文字の検出
  const hasInvisibleChar = charCodes.some(code => {
    return (
      code === 0xEE45 || // PDFで見つかった特殊文字
      code === 0x200B || // ゼロ幅スペース
      code === 0xFFFD || // 置換文字
      (code >= 0xE000 && code <= 0xF8FF) // 私用領域
    )
  })
  
  if (hasInvisibleChar) {
    return '住所に不可視文字が含まれています（文字欠損の可能性）'
  }
  
  // 住所特有のパターンチェック
  // 建物名や号室などで空白が含まれるのは正常
  // 例: "Ｇｒａｃｅ　Ｃｏｕｒｔ　Ｍｅｇｕｒｏ", "パークハウス　２０１号室"
  
  // 異常なパターンのみチェック
  // 10個以上の連続した空白は異常
  if (/[\s　]{10,}/.test(address)) {
    return '住所に異常な連続空白が含まれています'
  }
  
  // 住所が極端に短い（5文字未満）場合は警告
  if (address.length < 5) {
    return '住所が短すぎます（文字欠損の可能性）'
  }
  
  return undefined
}