'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  createProjectSchema,
  projectNameWithUniquenessCheckSchema 
} from '@/lib/schemas/property'
import { 
  CreateProjectFormData,
  PropertyData,
  SavePropertiesResponse 
} from '@/lib/types/property'
import {
  createProjectAction,
  savePropertiesAction,
  checkProjectName
} from '@/lib/actions/property'
import { toast } from 'sonner'
import AwesomeDebouncePromise from "awesome-debounce-promise"

interface SavePropertiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: PropertyData[]
  onSaveComplete?: (response: SavePropertiesResponse) => void
}

// 動的なスキーマを作成
const createDynamicProjectSchema = () => {
  return createProjectSchema.extend({
    name: projectNameWithUniquenessCheckSchema.refine(
      AwesomeDebouncePromise(
        async (name) => await checkProjectName(name),
        500
      ),
      {
        message: "このプロジェクト名は既に使用されています",
      }
    ),
  });
};

export function SavePropertiesDialog({
  open,
  onOpenChange,
  properties,
  onSaveComplete,
}: SavePropertiesDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [saveProgress, setSaveProgress] = useState<number>(0)
  
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createDynamicProjectSchema()),
    defaultValues: {
      name: '',
      description: '',
    },
  })
  
  const handleSave = async () => {
    setIsLoading(true)
    setSaveProgress(0)
    
    try {
      // フォームのバリデーション
      const isValid = await form.trigger()
      if (!isValid) {
        setIsLoading(false)
        return
      }
      
      const formData = form.getValues()
      
      // 新規プロジェクト作成
      const createResult = await createProjectAction(formData)
      if (createResult.error) {
        toast.error(createResult.error)
        setIsLoading(false)
        return
      }
      
      if (!createResult.success || !createResult.data) {
        toast.error('プロジェクトの作成に失敗しました')
        setIsLoading(false)
        return
      }
      
      const projectId = createResult.data.id
      toast.success(`プロジェクト「${formData.name}」を作成しました`)
      
      // 物件データの保存
      setSaveProgress(10)
      
      const saveResult = await savePropertiesAction({
        projectId,
        properties: properties.map(p => ({
          propertyAddress: p.propertyAddress,
          ownerName: p.ownerName,
          ownerAddress: p.ownerAddress,
          lat: p.lat,
          lng: p.lng,
          streetViewAvailable: p.streetViewAvailable,
          sourceFileName: p.sourceFileName,
        })),
      })
      
      setSaveProgress(100)
      
      if (saveResult.success) {
        toast.success(
          `${saveResult.savedCount}件の物件情報を保存しました`,
          {
            description: saveResult.errors 
              ? `${saveResult.errors.length}件のエラーがありました` 
              : undefined,
          }
        )
        
        if (onSaveComplete) {
          onSaveComplete(saveResult)
        }
        
        // ダイアログを閉じる
        onOpenChange(false)
        form.reset()
      } else {
        const errorMessage = saveResult.errors?.[0]?.error || '保存に失敗しました'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('保存エラー:', error)
      toast.error('予期せぬエラーが発生しました')
    } finally {
      setIsLoading(false)
      setSaveProgress(0)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>物件情報をデータベースに保存</DialogTitle>
          <DialogDescription>
            {properties.length}件の物件情報を新規プロジェクトに保存します
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 新規プロジェクト作成フォーム */}
          <div className="space-y-2">
            <Label htmlFor="name">プロジェクト名 *</Label>
            <Input
              id="name"
              {...form.register('name')}
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
              {...form.register('description')}
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
          {isLoading && saveProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>保存中...</span>
                <span>{Math.round(saveProgress)}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${saveProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
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
      </DialogContent>
    </Dialog>
  )
}