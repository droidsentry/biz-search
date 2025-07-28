# フォーム実装パターン

## Zodスキーマ定義

```tsx
// lib/schemas/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})
```

## 型定義

```tsx
// lib/types/auth.types.ts
import { z } from 'zod'
import { loginSchema } from '@/lib/schemas/auth.schema'

export type LoginFormData = z.infer<typeof loginSchema>
```

## フォームコンポーネント

```tsx
// components/forms/LoginForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/schemas/auth.schema'
import { LoginFormData } from '@/lib/types/auth.types'
import { loginAction } from '@/app/actions/auth.actions'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    
    const result = await loginAction(formData)
    
    if (result.error) {
      // エラーハンドリング
      form.setError('root', { message: result.error })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          ログイン
        </Button>
      </form>
    </Form>
  )
}
```