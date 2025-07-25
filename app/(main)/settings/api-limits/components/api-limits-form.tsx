'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const apiLimitsSchema = z.object({
  daily_limit: z.number().min(1).max(100000),
  monthly_limit: z.number().min(1).max(10000000),
})

type ApiLimitsFormData = z.infer<typeof apiLimitsSchema>

interface ApiLimitsFormProps {
  limits: {
    api_name: string
    daily_limit: number
    monthly_limit: number
    is_active: boolean
  } | null
}

export function ApiLimitsForm({ limits }: ApiLimitsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ApiLimitsFormData>({
    resolver: zodResolver(apiLimitsSchema),
    defaultValues: {
      daily_limit: limits?.daily_limit || 100,
      monthly_limit: limits?.monthly_limit || 10000,
    },
  })
  
  const onSubmit = async (data: ApiLimitsFormData) => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('api_global_limits')
        .update({
          daily_limit: data.daily_limit,
          monthly_limit: data.monthly_limit,
        })
        .eq('api_name', 'google_custom_search')
        
      if (error) {
        console.error('制限更新エラー:', error)
        toast.error('制限の更新に失敗しました')
        return
      }
      
      toast.success('API制限を更新しました')
      router.refresh()
    } catch (error) {
      console.error('予期せぬエラー:', error)
      toast.error('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>制限設定</CardTitle>
        <CardDescription>
          Google Custom Search APIの利用制限を設定します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="daily_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>日次制限</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    1日あたりのAPI呼び出し回数の上限
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="monthly_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>月次制限</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    1ヶ月あたりのAPI呼び出し回数の上限
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              制限を更新
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}