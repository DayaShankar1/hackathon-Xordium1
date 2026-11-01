"use client";

import { Check, Copy, MessageCircle, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

type ContactDialogProps = {
  sellerName: string;
  itemTitle: string;
  priceFormatted: string;
};

export function ContactSellerDialog({ sellerName, itemTitle, priceFormatted }: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inquiryTemplate = `Hi ${sellerName}! I saw your listing for "${itemTitle}" (${priceFormatted}) on CampusSphere. Is it still available? I'd like to arrange an on-campus pickup.`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inquiryTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong"
      >
        <MessageCircle className="size-4" />
        Contact Seller
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Contact {sellerName}</h3>
                <p className="text-xs text-slate-500">CampusSphere Safe Student Exchange</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Suggested Message:</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-800 italic">
                &ldquo;{inquiryTemplate}&rdquo;
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-slate-500" />}
                  {copied ? "Copied to clipboard!" : "Copy message"}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-900">
              <p className="font-bold">Campus Safety Guidelines:</p>
              <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-emerald-800">
                <li>Always meet in public campus spots (e.g. library entrance, student cafeteria, campus gate).</li>
                <li>Inspect the item thoroughly before concluding the deal.</li>
                <li>Private contact details are kept secure to prevent unsolicited messages.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-10 rounded-xl bg-slate-100 px-5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

