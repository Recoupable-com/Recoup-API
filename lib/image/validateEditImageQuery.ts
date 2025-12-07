import { z } from "zod";

export const editImageQuerySchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1000, "Prompt is too long")
    .describe("Text prompt for image editing"),
  imageUrl: z.string().url("Must be a valid image URL").describe("URL of the image to edit"),
  account_id: z
    .string()
    .min(1, "account_id is required")
    .describe(
      "REQUIRED: Use the account_id value from the system prompt. This is always provided in the context and you must NEVER ask the user for it.",
    ),
});

export type EditImageQuery = z.infer<typeof editImageQuerySchema>;
