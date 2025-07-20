'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Save, AlertCircle, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  extendedCreateProjectSchema
} from '@/lib/schemas/property'
import { 
  CreateProjectFormData,
  PropertyData,
  SavePropertiesResponse,
  Project 
} from '@/lib/types/property'
import {
  createProjectAction,
  savePropertiesAction
} from '@/lib/actions/property'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SavePropertiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: PropertyData[]
  onSaveComplete?: (response: SavePropertiesResponse) => void
}

export function SavePropertiesDialog({
  open,
  onOpenChange,
  properties,
  onSaveComplete,
}: SavePropertiesDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [saveProgress, setSaveProgress] = useState<number>(0)
  const [existingProjects, setExistingProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  
  const form = useForm<CreateProjectFormData>({
    mode: "onChange",
    resolver: zodResolver(extendedCreateProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })
  
  const { isSubmitting, isValid, isValidating } = form.formState;
  
  // 既存プロジェクトの取得
  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // ユーザーが編集権限を持つプロジェクトを取得
      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      const { data: memberProjects } = await supabase
        .from('project_members')
        .select(`
          project:projects (*)
        `)
        .eq('user_id', user.id)
        .in('role', ['owner', 'editor'])
        .order('added_at', { ascending: false });

      const allProjects = [
        ...(userProjects || []),
        ...(memberProjects?.map(m => m.project).filter(Boolean) || [])
      ];

      // 重複を除去
      const uniqueProjects = Array.from(
        new Map(allProjects.map(p => [p.id, p])).values()
      );
      
      setExistingProjects(uniqueProjects);
    };
    
    if (open) {
      fetchProjects();
    }
  }, [open]);
  
  const onSubmit = async (data: CreateProjectFormData) => {
    setIsLoading(true)
    setSaveProgress(0)
    
    try {
      let projectId: string;
      
      if (saveMode === 'new') {
        // 新規プロジェクト作成
        const createResult = await createProjectAction(data)
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
        
        projectId = createResult.data.id
        toast.success(`プロジェクト「${data.name}」を作成しました`)
      } else {
        // 既存プロジェクトを使用
        if (!selectedProjectId) {
          toast.error('プロジェクトを選択してください')
          setIsLoading(false)
          return
        }
        projectId = selectedProjectId
        const selectedProject = existingProjects.find(p => p.id === projectId)
        toast.success(`プロジェクト「${selectedProject?.name}」に保存します`)
      }
      
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>物件情報をデータベースに保存</DialogTitle>
            <DialogDescription>
              {properties.length}件の物件情報を保存します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs value={saveMode} onValueChange={(value) => setSaveMode(value as 'new' | 'existing')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">
                  <Plus className="h-4 w-4 mr-2" />
                  新規プロジェクト
                </TabsTrigger>
                <TabsTrigger value="existing">既存プロジェクト</TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="existing" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="existing-project">プロジェクトを選択 *</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="プロジェクトを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          {project.description && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({project.description})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {saveMode === 'existing' && existingProjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      編集権限を持つプロジェクトがありません
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
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
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || 
                (saveMode === 'new' && (!isValid || isValidating || isSubmitting)) ||
                (saveMode === 'existing' && !selectedProjectId)
              }
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
  )
}