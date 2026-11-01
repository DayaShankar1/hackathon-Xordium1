import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid campus email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(60, "Keep your name under 60 characters."),
  email: z.string().trim().email("Enter a valid campus email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Keep your password under 72 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid campus email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Keep your password under 72 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(60, "Keep your name under 60 characters."),
});
