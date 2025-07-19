import { inviteSchema } from "@/lib/schemas/invite";
import { z } from "zod";

export type Invite = z.infer<typeof inviteSchema>