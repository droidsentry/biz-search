import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import { parsePropertyOwnerData } from '@/lib/property-parser'
import { createClient } from '@/lib/supabase/server'

// 型定義
interface PDFMetadata {
  Title?: string
  Author?: string
  Subject?: string
  Creator?: string
  Producer?: string
  CreationDate?: string
  ModDate?: string
  [key: string]: string | undefined
}

interface FileResult {
  fileName: string
  fileSize: number
  status: 'success' | 'error'
  pageCount?: number
  textLength?: number
  text?: string
  metadata?: PDFMetadata
  propertyData?: Array<{
    recordDate: string
    propertyAddress: string
    ownerName: string
    ownerAddress: string
  }>
  error?: string
}

interface APIResponse {
  success: boolean
  results: FileResult[]
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// 設定
const MAX_FILE_SIZE = 2 * 1024 * 1024    // 2MB
const MAX_FILES = 100                     // 100ファイル（バッチ処理用に増加）
const MAX_TOTAL_SIZE = 5 * 1024 * 1024   // 合計5MB（1バッチあたり）
const RESPONSE_SIZE_LIMIT = 4 * 1024 * 1024  // 4MB

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const formData = await request.formData()
    const files = formData.getAll('pdfs') as File[]

    // バリデーション
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // Supabaseクライアントを作成して認証確認
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // API制限チェック（PDF処理）
    const { data: limitCheck, error: limitCheckError } = await supabase
      .rpc('check_global_api_limit', {
        p_api_name: 'pdf_parsing',
        p_increment: files.length
      })

    if (limitCheckError) {
      console.error('API制限確認エラー:', limitCheckError)
      return NextResponse.json(
        { error: 'API制限の確認中にエラーが発生しました' },
        { status: 500 }
      )
    }

    // RPCの戻り値をキャスト
    interface LimitCheckResult {
      allowed: boolean
      daily_used: number
      daily_limit: number
      monthly_used: number
      monthly_limit: number
    }
    
    const limitResult = limitCheck as unknown as LimitCheckResult

    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: `PDF処理制限に達しました。本日: ${limitResult.daily_used}/${limitResult.daily_limit}件、今月: ${limitResult.monthly_used}/${limitResult.monthly_limit}件` 
        },
        { status: 429 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `最大${MAX_FILES}ファイルまで処理可能です` },
        { status: 400 }
      )
    }

    // ファイルサイズチェック
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / 1024 / 1024}MB）。PDFの分割や圧縮をご検討ください。`,
          files: oversizedFiles.map(f => ({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` }))
        },
        { status: 400 }
      )
    }

    // 合計サイズチェック
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { 
          error: `合計ファイルサイズが大きすぎます（最大${MAX_TOTAL_SIZE / 1024 / 1024}MB、現在${(totalSize / 1024 / 1024).toFixed(2)}MB）`,
          suggestion: '一度に処理するファイル数を減らしてください。'
        },
        { status: 400 }
      )
    }

    // レスポンスサイズの概算（1ファイルあたり平均30KB想定 - より正確な見積もり）
    const estimatedResponseSize = files.length * 30 * 1024
    if (estimatedResponseSize > RESPONSE_SIZE_LIMIT) {
      return NextResponse.json(
        { 
          error: 'レスポンスサイズが制限を超える可能性があります。',
          suggestion: `ファイル数を${Math.floor(RESPONSE_SIZE_LIMIT / (30 * 1024))}件以下に減らして再実行してください。`
        },
        { status: 400 }
      )
    }

    // ファイル処理
    const results: FileResult[] = []
    let successCount = 0
    let errorCount = 0

    // 1件のみの場合はフルテキストを含める
    const includeFullText = files.length === 1

    for (const file of files) {
      const result = await processFile(file, includeFullText)
      results.push(result)
      
      if (result.status === 'success') {
        successCount++
      } else {
        errorCount++
      }
    }

    // レスポンス作成
    const response: APIResponse = {
      success: errorCount === 0,
      results,
      summary: {
        total: files.length,
        successful: successCount,
        failed: errorCount
      }
    }

    // 最終的なレスポンスサイズチェック
    const responseString = JSON.stringify(response)
    const responseSize = new TextEncoder().encode(responseString).length

    if (responseSize > RESPONSE_SIZE_LIMIT) {
      return NextResponse.json(
        { 
          error: 'レスポンスサイズが4MBを超えました。',
          suggestion: 'より少ないファイル数で再実行してください。'
        },
        { status: 400 }
      )
    }

    // 処理ログを記録（エラーは無視）
    const processingTime = Date.now() - startTime
    supabase
      .from('pdf_processing_logs')
      .insert({
        user_id: user.id,
        file_count: files.length,
        success_count: successCount,
        error_count: errorCount,
        processing_time: processingTime
      })
      .then(({ error }) => {
        if (error) {
          console.error('PDF処理ログ記録エラー:', error)
        }
      })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Route handler error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

async function processFile(file: File, includeFullText: boolean): Promise<FileResult> {
  try {
    // PDFファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // pdf2jsonで解析
    const pdfData = await parsePDF(buffer)
    console.log("pdfData", pdfData)

    // テキスト抽出
    const extractedText = extractTextFromPDFData(pdfData)
    console.log("extractedText", extractedText)
    
    // 不動産情報をパース
    const propertyData = parsePropertyOwnerData(extractedText)

    return {
      fileName: file.name,
      fileSize: file.size,
      status: 'success',
      pageCount: pdfData.Pages.length,
      textLength: extractedText.length,
      text: includeFullText ? extractedText : undefined,
      metadata: pdfData.Meta || {},
      propertyData
    }
  } catch (error) {
    return {
      fileName: file.name,
      fileSize: file.size,
      status: 'error',
      error: error instanceof Error ? error.message : '不明なエラー'
    }
  }
}

// PDF2Jsonの型定義
interface PDFTextItem {
  R: Array<{ T: string }>
  x: number
  y: number
}

interface PDFPage {
  Texts: PDFTextItem[]
}

interface PDFData {
  Pages: PDFPage[]
  Meta?: PDFMetadata
}

function parsePDF(buffer: Buffer): Promise<PDFData> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser()

    parser.on('pdfParser_dataError', (errMsg: { parserError: Error }) => {
      reject(new Error(`PDF解析エラー: ${errMsg.parserError.message || errMsg.parserError}`))
    })

    parser.on('pdfParser_dataReady', (pdfData: unknown) => {
      resolve(pdfData as PDFData)
    })

    parser.parseBuffer(buffer)
  })
}

function extractTextFromPDFData(pdfData: PDFData): string {
  let fullText = ''

  // 各ページからテキストを抽出
  pdfData.Pages.forEach((page: PDFPage, pageIndex: number) => {
    if (pageIndex > 0) {
      fullText += '\n\n--- ページ ' + (pageIndex + 1) + ' ---\n\n'
    }

    // テキストアイテムを位置順にソート
    const texts = page.Texts || []
    const sortedTexts = texts.sort((a: PDFTextItem, b: PDFTextItem) => {
      // Y座標でソート（上から下）
      if (Math.abs(a.y - b.y) > 0.1) {
        return a.y - b.y
      }
      // 同じ行ならX座標でソート（左から右）
      return a.x - b.x
    })

    // 前の行のY座標を記録
    let prevY = -1
    
    sortedTexts.forEach((text: PDFTextItem) => {
      // 新しい行かどうかチェック
      if (prevY !== -1 && Math.abs(text.y - prevY) > 0.1) {
        fullText += '\n'
      }
      
      // テキストを抽出（URLデコード）
      const decodedText = decodeURIComponent(text.R[0].T)
      fullText += decodedText + ' '
      
      prevY = text.y
    })
  })
  

  return fullText.trim()
}