import { loginWithEmailOrUsernameSchema, passwordUpdateSchema, signupSchema } from "@/lib/schemas/auth";
import { z } from "zod";

export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type Signup = z.infer<typeof signupSchema>;
export type LoginWithEmailOrUsername = z.infer<typeof loginWithEmailOrUsernameSchema>;

