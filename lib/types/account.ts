import { z } from 'zod'
import { displayNameSchema, usernameSchema } from '@/lib/schemas/account'

export type DisplayNameFormData = z.infer<typeof displayNameSchema>
export type UsernameFormData = z.infer<typeof usernameSchema>