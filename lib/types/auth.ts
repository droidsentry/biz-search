import { loginSchema, passwordUpdateSchema } from "@/lib/schemas/auth";
import { z } from "zod";

export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type Login = z.infer<typeof loginSchema>;
