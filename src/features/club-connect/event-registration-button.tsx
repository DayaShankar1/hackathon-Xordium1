"use client";

import { Check, Loader2, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelEventRegistration, registerForEvent } from "./actions";

type RegistrationButtonProps = {
  eventId: string;
  isRegistered: boolean;
  isFull: boolean;
  isPast?: boolean;
  size?: "sm" | "md" | "lg";
};

export function EventRegistrationButton({
  eventId,
  isRegistered,
  isFull,
  isPast = false,
  size = "md",
}: RegistrationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);

    startTransition(async () => {
      if (isRegistered) {
        const res = await cancelEventRegistration(eventId);
        if (!res.ok) {
          setErrorMessage(res.error);
        } else {
          router.refresh();
        }
      } else {
        const res = await registerForEvent(eventId);
        if (!res.ok) {
          setErrorMessage(res.error);
        } else {
          router.refresh();
        }
      }
    });
  };

  if (isPast) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
        Event Concluded
      </span>
    );
  }

  const sizeClasses = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-9 px-4 text-xs font-semibold rounded-xl",
    lg: "h-11 px-5 text-sm font-bold rounded-xl",
  }[size];

  return (
    <div className="flex flex-col items-start gap-1">
      {isRegistered ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={`group inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 ${sizeClasses}`}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Check className="size-3.5 text-emerald-600 group-hover:hidden" />
              <UserMinus className="hidden size-3.5 text-rose-600 group-hover:inline" />
              <span className="group-hover:hidden">Registered</span>
              <span className="hidden group-hover:inline">Cancel RSVP</span>
            </>
          )}
        </button>
      ) : isFull ? (
        <span
          className={`inline-flex items-center gap-1.5 border border-slate-200 bg-slate-100 text-slate-500 ${sizeClasses}`}
        >
          Full Capacity
        </span>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 bg-brand text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60 ${sizeClasses}`}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <UserPlus className="size-3.5" />
              <span>Register Now</span>
            </>
          )}
        </button>
      )}
      {errorMessage && <p className="text-[11px] font-medium text-rose-600">{errorMessage}</p>}
    </div>
  );
}

