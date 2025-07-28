"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { extendedCreateProjectSchema } from "@/lib/schemas/property";
import {
  CreateProjectFormData,
  PropertyData,
  SavePropertiesResponse,
  SaveProgress,
  CreateProjectAndImportResponse,
} from "@/lib/types/property";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

interface SavePropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyData[];
  onSaveComplete?: (response: SavePropertiesResponse) => void;
}

export function SavePropertiesDialog({
  open,
  onOpenChange,
  properties,
  onSaveComplete,
}: SavePropertiesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  const supabase = createClient();

  const form = useForm<CreateProjectFormData>({
    mode: "onChange",
    resolver: zodResolver(extendedCreateProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { isSubmitting, isValid, isValidating } = form.formState;

  const onSubmit = async (data: CreateProjectFormData) => {
    setIsLoading(true);
    
    try {
      // 1. セッションIDを生成
      const sessionId = crypto.randomUUID();
      
      // 2. プログレス表示を開始
      setSaveProgress({ phase: 'uploading', progress: 0 });
      
      // 3. バッチでステージングテーブルにデータ投入
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(properties.length / BATCH_SIZE);
      
      for (let i = 0; i < properties.length; i += BATCH_SIZE) {
        const batch = properties.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        
        const { error } = await supabase
          .from('import_staging')
          .insert(
            batch.map(p => ({
              session_id: sessionId,
              property_address: p.propertyAddress,
              owner_name: p.ownerName,
              owner_address: p.ownerAddress,
              lat: p.lat,
              lng: p.lng,
              street_view_available: p.streetViewAvailable || false,
              source_file_name: p.sourceFileName || ''
            }))
          );
        
        if (error) {
          console.error('ステージングデータ投入エラー:', error);
          throw new Error('データのアップロードに失敗しました');
        }
        
        // プログレス更新
        const progress = Math.min((i + batch.length) / properties.length * 100, 100);
        setSaveProgress({ 
          phase: 'uploading', 
          progress,
          currentBatch,
          totalBatches 
        });
      }
      
      // 4. RPC関数を呼び出して一括処理
      setSaveProgress({ phase: 'processing', progress: 0 });
      
      const { data: result, error: rpcError } = await supabase
        .rpc('create_project_and_import_properties', {
          p_project_name: data.name,
          p_project_description: data.description || '',
          p_session_id: sessionId
        });
      
      if (rpcError) {
        console.error('RPC実行エラー:', rpcError);
        throw new Error(rpcError.message || 'プロジェクトの作成に失敗しました');
      }
      
      const typedResult = result as CreateProjectAndImportResponse | null;
      
      if (!typedResult || !typedResult.success) {
        throw new Error('プロジェクトの作成に失敗しました');
      }
      
      // 5. 成功
      setSaveProgress({ phase: 'completed', progress: 100 });
      
      toast.success(
        `プロジェクト「${typedResult.projectName}」を作成し、${typedResult.importedCount}件の物件情報を保存しました`
      );
      
      if (onSaveComplete) {
        onSaveComplete({
          success: true,
          projectId: typedResult.projectId,
          projectName: typedResult.projectName,
          savedCount: typedResult.importedCount,
          errors: typedResult.errors?.map((err, index) => ({
            index,
            propertyAddress: '',
            error: err.error
          }))
        });
      }
      
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('保存エラー:', error);
      toast.error(error instanceof Error ? error.message : '保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>物件情報をデータベースに保存</DialogTitle>
            <DialogDescription>
              {properties.length}件の物件情報を新規プロジェクトに保存します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 新規プロジェクト作成フォーム */}
            <div className="space-y-2">
              <Label htmlFor="name">プロジェクト名 *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="例: 渋谷区物件調査2025"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.name.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="プロジェクトの説明を入力"
                rows={3}
                disabled={isLoading}
              />
              {form.formState.errors.description && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.description.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* 保存進捗 */}
            {saveProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {saveProgress.phase === 'uploading' && (
                      <>
                        データをアップロード中...
                        {saveProgress.currentBatch && saveProgress.totalBatches && (
                          <span className="text-muted-foreground ml-2">
                            (処理 {saveProgress.currentBatch}/{saveProgress.totalBatches})
                          </span>
                        )}
                      </>
                    )}
                    {saveProgress.phase === 'processing' && 'データを処理中...'}
                    {saveProgress.phase === 'completed' && '完了しました'}
                  </span>
                  <span>{Math.round(saveProgress.progress)}%</span>
                </div>
                <Progress value={saveProgress.progress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isValidating || isSubmitting || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
