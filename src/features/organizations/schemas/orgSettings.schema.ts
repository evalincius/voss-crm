import { z } from "zod";

export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

export type UpdateOrgSchema = z.infer<typeof updateOrgSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["owner", "member"], {
    message: "Please select a role",
  }),
});

export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;
