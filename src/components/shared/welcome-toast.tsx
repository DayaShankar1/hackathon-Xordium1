"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast({ show }: { show: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!show) return;

    toast.success("Account created successfully. Welcome to CampusSphere!", {
      id: "account-created",
    });
    router.replace("/dashboard", { scroll: false });
  }, [router, show]);

  return null;
}
