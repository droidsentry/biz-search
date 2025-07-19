import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import pLimit from 'p-limit'
import { parsePropertyOwnerData } from '@/lib/property-parser'

// 並列処理の制限
const limit = pLimit(3) // Vercel環境に最適化

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

interface InitEventData {
  totalFiles: number
  startTime: string
}

interface ProgressEventData {
  processed: number
  total: number
  currentFile: string
  percentage: number
}

interface ResultEventData {
  index: number
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
  processingTime: number
}

interface CompleteEventData {
  totalFiles: number
  successful: number
  failed: number
  skipped: number
  duration: number
}

interface WarningEventData {
  message: string
  fileName?: string
  processed?: number
  remaining?: number
}

interface ErrorEventData {
  error: string
  message: string
}

type ProcessingEventData = InitEventData | ProgressEventData | ResultEventData | CompleteEventData | WarningEventData | ErrorEventData

interface ProcessingEvent {
  type: 'init' | 'progress' | 'result' | 'error' | 'complete' | 'warning'
  data: ProcessingEventData
}

// Vercel環境に最適化した設定
const MAX_FILE_SIZE = 2 * 1024 * 1024    // 2MB
const MAX_FILES = 50                      // 50ファイル
const MAX_TOTAL_SIZE = 10 * 1024 * 1024  // 合計10MB
const EXECUTION_TIMEOUT = 9000            // 9秒タイムアウト
const MEMORY_THRESHOLD = 1.5 * 1024 * 1024 * 1024 // 1.5GBメモリ閾値

export async function POST(request: NextRequest) {
  try {
    console.log('request.body', request.body)
    const formData = await request.formData()
    const files = formData.getAll('pdfs') as File[]

    // バリデーション
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
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

    // ストリーミングレスポンスの準備
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // 非同期で処理を開始
    processBulkPDFs(files, writer, encoder).catch(console.error)

    // ストリーミングレスポンスを返す
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (error) {
    console.error('Route handler error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// メモリ使用量を取得
function getMemoryUsage(): number {
  return process.memoryUsage().heapUsed
}

// メモリ閾値チェック
function checkMemoryThreshold(): boolean {
  return getMemoryUsage() > MEMORY_THRESHOLD
}

async function processBulkPDFs(
  files: File[],
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder
) {
  const startTime = Date.now()
  let processedCount = 0
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  // タイムアウト設定
  const timeoutId = setTimeout(() => {
    sendEvent(writer, encoder, {
      type: 'warning',
      data: { 
        message: '処理時間制限に近づいています。残りのファイルをスキップします。',
        processed: processedCount,
        remaining: files.length - processedCount
      }
    })
  }, EXECUTION_TIMEOUT)

  try {
    // 初期化イベント送信
    await sendEvent(writer, encoder, {
      type: 'init',
      data: {
        totalFiles: files.length,
        startTime: new Date().toISOString()
      }
    })

    // 小さいファイルから処理（成功率向上のため）
    const sortedFiles = [...files].sort((a, b) => a.size - b.size)

    // ファイル処理タスクを作成
    const tasks = sortedFiles.map((file, index) =>
      limit(async () => {
        // メモリチェック
        if (checkMemoryThreshold()) {
          skippedCount++
          await sendEvent(writer, encoder, {
            type: 'warning',
            data: {
              message: 'メモリ制限のため、一部のファイルをスキップしました',
              fileName: file.name
            }
          })
          return
        }

        const result = await processFile(file, index)
        processedCount++

        if (result.type === 'result' && (result.data as ResultEventData).status === 'success') {
          successCount++
        } else {
          errorCount++
        }

        // 結果を送信
        await sendEvent(writer, encoder, result)

        // 進捗を送信
        await sendEvent(writer, encoder, {
          type: 'progress',
          data: {
            processed: processedCount,
            total: files.length,
            currentFile: file.name,
            percentage: Math.round((processedCount / files.length) * 100)
          }
        })

        return result
      })
    )

    // 全タスクの完了を待つ
    await Promise.allSettled(tasks)

    // 完了イベント送信
    await sendEvent(writer, encoder, {
      type: 'complete',
      data: {
        totalFiles: files.length,
        successful: successCount,
        failed: errorCount,
        skipped: skippedCount,
        duration: Date.now() - startTime
      }
    })
  } catch (error) {
    console.error('Processing error:', error)
    await sendEvent(writer, encoder, {
      type: 'error',
      data: {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  } finally {
    clearTimeout(timeoutId)
    await writer.close()
  }
}

async function processFile(file: File, index: number): Promise<ProcessingEvent> {
  const startTime = Date.now()

  try {
    // PDFファイルをバッファに変換
    let arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // メモリを即座に解放
    arrayBuffer = new ArrayBuffer(0)

    // pdf2jsonで解析
    const pdfData = await parsePDF(buffer)

    // テキスト抽出
    const extractedText = extractTextFromPDFData(pdfData)
    
    // 不動産情報をパース
    const propertyData = parsePropertyOwnerData(extractedText)

    const processingTime = Date.now() - startTime

    return {
      type: 'result',
      data: {
        index,
        fileName: file.name,
        fileSize: file.size,
        status: 'success' as const,
        pageCount: pdfData.Pages.length,
        textLength: extractedText.length,
        text: extractedText,
        metadata: pdfData.Meta || {},
        propertyData,
        processingTime
      }
    }
  } catch (error) {
    const processingTime = Date.now() - startTime

    return {
      type: 'error',
      data: {
        index,
        fileName: file.name,
        fileSize: file.size,
        status: 'error' as const,
        error: error instanceof Error ? error.message : '不明なエラー',
        processingTime
      }
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

async function sendEvent(
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  event: ProcessingEvent
) {
  const data = JSON.stringify(event) + '\n'
  await writer.write(encoder.encode(data))
}