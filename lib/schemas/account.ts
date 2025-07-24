import { z } from 'zod'

export const displayNameSchema = z.object({
  displayName: z.string()
    .trim()
    .max(10, '表示名は10文字以内で入力してください')
})