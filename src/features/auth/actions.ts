"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/utils/supabase/server";

import {
  forgotPasswordSchema,
  profileSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

export type AuthField = "displayName" | "email" | "password" | "confirmPassword";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
};

function configurationError(): AuthActionState {
  return {
    status: "error",
    message: "Supabase is not configured yet. Add the required values to .env.local and restart the app.",
  };
}

function friendlyAuthError(message: string, operation: "signin" | "signup" | "recovery" | "reset") {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Wait a moment, then try again.";
  }

  if (operation === "signin" && (normalized.includes("invalid login") || normalized.includes("email not confirmed"))) {
    return "The email or password is incorrect.";
  }

  if (
    operation === "signup" &&
    (normalized.includes("already registered") || normalized.includes("already exists"))
  ) {
    return "An account with this email already exists. Sign in instead.";
  }

  if (operation === "signup" && normalized.includes("database error")) {
    return "Your account could not be created because profile setup failed. Please try again or contact support.";
  }

  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return "Choose a stronger password and try again.";
  }

  const labels = {
    signin: "sign in",
    signup: "create your account",
    recovery: "send the reset email",
    reset: "update your password",
  } as const;

  return `Unable to ${labels[operation]} right now. Please try again.`;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return configurationError();
  }

  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      status: "error",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword(result.data);

    if (error || !data.session) {
      return {
        status: "error",
        message: friendlyAuthError(error?.message ?? "Session was not created.", "signin"),
      };
    }
  } catch {
    return {
      status: "error",
      message: "CampusSphere could not reach Supabase. Check your connection and try again.",
    };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return configurationError();
  }

  const result = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      status: "error",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          display_name: result.data.displayName,
        },
      },
    });

    if (error) {
      return {
        status: "error",
        message: friendlyAuthError(error.message, "signup"),
      };
    }

    if (!data.user || !data.session) {
      return {
        status: "error",
        message: "Supabase did not establish a session, so registration was not completed. Please try again or contact support.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", data.user.id)
      .maybeSingle<{ id: string; role: string }>();

    if (profileError || !profile || profile.role !== "student") {
      await supabase.auth.signOut({ scope: "local" });
      return {
        status: "error",
        message: "Your account was created, but the student profile could not be verified. Please contact support before signing in.",
      };
    }
  } catch {
    await supabase.auth.signOut({ scope: "local" });
    return {
      status: "error",
      message: "CampusSphere could not reach Supabase. Check your connection and try again.",
    };
  }

  redirect("/dashboard?welcome=1");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return configurationError();
  }

  const result = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!result.success) {
    return {
      status: "error",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      status: "error",
      message: friendlyAuthError(error.message, "recovery"),
    };
  }

  return {
    status: "success",
    message: "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return configurationError();
  }

  const result = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      status: "error",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message: "This reset link is invalid or expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: result.data.password });

  if (error) {
    return {
      status: "error",
      message: friendlyAuthError(error.message, "reset"),
    };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?password=updated");
}

export async function updateProfileAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return configurationError();
  }

  const result = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!result.success) {
    return {
      status: "error",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return {
      status: "error",
      message: "Your session expired. Sign in again before updating your profile.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: result.data.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "Your profile could not be updated. Confirm that the database schema and RLS policies are applied.",
    };
  }

  revalidatePath("/app", "layout");
  revalidatePath("/dashboard", "layout");
  return {
    status: "success",
    message: "Profile updated.",
  };
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/app/profile?signout=failed");
  }

  redirect("/login");
}
