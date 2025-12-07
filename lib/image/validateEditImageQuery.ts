import { z } from "zod";

export const editImageQuerySchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1000, "Prompt is too long")
    .describe("Text prompt for image editing"),
  imageUrl: z.url("Must be a valid image URL").describe("URL of the image to edit"),
  account_id: z
    .string()
    .min(1, "account_id is required")
    .describe("The UUID of the account to edit the image for."),
});

export type EditImageQuery = z.infer<typeof editImageQuerySchema>;
