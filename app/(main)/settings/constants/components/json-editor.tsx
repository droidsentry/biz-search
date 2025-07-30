"use client";

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface JsonEditorProps<T = Record<string, unknown>> {
  value: T;
  onChange: (value: T) => void;
}

export default function JsonEditor<T = Record<string, unknown>>({ value, onChange }: JsonEditorProps<T>) {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setJsonString(JSON.stringify(value, null, 2));
  }, [value]);
  
  const handleChange = (newValue: string) => {
    setJsonString(newValue);
    
    try {
      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON解析エラー');
    }
  };
  
  return (
    <div className="space-y-2">
      <Textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        className="font-mono text-sm min-h-[400px]"
        placeholder="JSON形式で入力"
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}