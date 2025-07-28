"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, X, AlertCircle } from "lucide-react";

interface FileConfirmProps {
  files: File[];
  onConfirm: () => void;
  onCancel: () => void;
  onRemoveFile: (index: number) => void;
}

export function FileConfirm({
  files,
  onConfirm,
  onCancel,
  onRemoveFile,
}: FileConfirmProps) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const BATCH_SIZE = 50;
  const batchCount = Math.ceil(files.length / BATCH_SIZE);
  const showBatchWarning = files.length > BATCH_SIZE;

  // 「所有者事項」が含まれていないファイルをチェック
  const invalidFiles = files.filter(
    (file) => !file.name.includes("所有者事項")
  );
  const hasInvalidFiles = invalidFiles.length > 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">ファイルを確認</h2>
        <p className="mt-2 text-zinc-400">
          {files.length}個のPDFファイルが選択されました
        </p>
      </div>

      {hasInvalidFiles && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-500">
                不適切なファイルが含まれています
              </p>
              <p className="text-sm text-zinc-400">
                {invalidFiles.length}
                個のファイル名に「所有者事項」が含まれていません。
                正しいファイルを選択しているか確認してください。
              </p>
            </div>
          </div>
        </div>
      )}

      {showBatchWarning && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-500">
                大量のファイルが選択されています
              </p>
              <p className="text-sm text-zinc-400">
                {files.length}個のファイルは{batchCount}
                回に分けて処理されます。
                <br />
                各処理は{BATCH_SIZE}
                ファイルずつ処理され、全体の処理には時間がかかる場合があります。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 上部のアクションボタン（ファイルが多い場合のみ表示） */}
      {files.length > 10 && (
        <div className="flex justify-end gap-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white"
            size="sm"
          >
            キャンセル
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    onClick={onConfirm}
                    disabled={files.length === 0 || hasInvalidFiles}
                    size="sm"
                  >
                    解析を開始
                  </Button>
                </span>
              </TooltipTrigger>
              {hasInvalidFiles && (
                <TooltipContent>
                  <p>
                    「所有者事項」が含まれていないファイルを削除してから解析を開始してください
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">選択されたファイル</span>
            <span className="text-sm text-zinc-400">
              合計: {formatFileSize(totalSize)}
            </span>
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          {files.map((file, index) => {
            const isValidFile = file.name.includes("所有者事項");

            return (
              <div
                key={index}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-3">
                  <FileText
                    className={`h-5 w-5 ${
                      isValidFile ? "text-zinc-500" : "text-red-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isValidFile ? "text-white" : "text-red-500"
                      }`}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(file.size)}
                    </p>
                    {!isValidFile && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ ファイル名に「所有者事項」が含まれていません
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveFile(index)}
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label={`${file.name}を削除`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-zinc-400 hover:text-white"
        >
          キャンセル
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  onClick={onConfirm}
                  disabled={files.length === 0 || hasInvalidFiles}
                >
                  解析を開始
                </Button>
              </span>
            </TooltipTrigger>
            {hasInvalidFiles && (
              <TooltipContent>
                <p>
                  「所有者事項」が含まれていないファイルを削除してから解析を開始してください
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
