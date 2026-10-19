import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");
