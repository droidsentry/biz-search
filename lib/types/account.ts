import { z } from 'zod'
import { displayNameSchema } from '@/lib/schemas/account'
import { unDebouncedUsernameSchema } from '../schemas/auth'

export type DisplayNameFormData = z.infer<typeof displayNameSchema>
export type UsernameFormData = z.infer<typeof unDebouncedUsernameSchema>