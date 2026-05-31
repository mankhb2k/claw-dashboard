import { z } from "zod";

export const setupFormSchema = z.object({
  displayName: z
    .string()
    .min(1, "Enter a workspace name")
    .max(200, "Max 200 characters"),
});

export type SetupFormInput = z.infer<typeof setupFormSchema>;
