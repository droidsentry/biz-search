'use client';

import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  onCopy?: () => void;
}

export function CopyButton({
  value,
  className,
  children,
  showIcon = true,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      onCopy?.();
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'relative grid place-content-center transition-all',
        showIcon && 'border rounded-md w-8 h-8 bg-muted text-muted-foreground hover:bg-muted/80',
        className
      )}
    >
      {showIcon ? (
        <>
          <div
            className={cn(
              'absolute inset-0 grid place-content-center transition-all duration-300',
              copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
          >
            <Check size={16} />
          </div>
          <div
            className={cn(
              'transition-all duration-300',
              copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            )}
          >
            <Copy size={16} />
          </div>
        </>
      ) : (
        <>
          {children}
          {copied && (
            <div className="absolute inset-0 grid place-content-center bg-muted/90 rounded transition-opacity duration-300">
              <Check size={16} className="text-green-500" />
            </div>
          )}
        </>
      )}
      <span className="sr-only">コピー</span>
    </button>
  );
}