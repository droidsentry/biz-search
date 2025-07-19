import { z } from "zod";
import { emailSchema } from "./auth";


export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['system_owner', 'user'],{
    message: '役割を選択してください',
  }),
})