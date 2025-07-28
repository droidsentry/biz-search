"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropzone({ onDrop, disabled = false }: FileDropzoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop, // ドロップされたファイルを処理
    accept: {
      "application/pdf": [".pdf"],
    }, // PDFファイルのみ受け付ける
    disabled, // 無効化されている場合はドロップできない
    multiple: true, // 複数ファイル選択可能
    maxFiles: 400, // 最大300ファイルまで
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex h-[400px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
        isDragActive
          ? "border-white bg-white/5"
          : "border-zinc-800 hover:border-zinc-600",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "transition-all duration-200",
            isDragActive && "scale-110"
          )}
        >
          <FileText className="h-16 w-16 text-zinc-400" />
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-white">
            {isDragActive ? "ドロップして解析開始" : "PDFをドロップ"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            またはクリックして選択（最大400ファイル）
          </p>
        </div>
      </div>
    </div>
  );
}
