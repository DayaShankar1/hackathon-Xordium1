"use client";

import { AlertCircle, IndianRupee, Loader2, ShoppingBag, Upload, X } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { createListing } from "./actions";
import { ITEM_CONDITIONS, MARKETPLACE_CATEGORIES, type ItemConditionValue } from "./constants";
import { uploadListingImage, validateListingImage } from "./storage";

export function MarketplaceListingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(MARKETPLACE_CATEGORIES[0].value);
  const [condition, setCondition] = useState<string>("good");
  const [price, setPrice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateListingImage(file);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const listingId = crypto.randomUUID();
        let imagePath: string | null = null;

        if (selectedFile) {
          imagePath = await uploadListingImage(selectedFile, userId, listingId);
        }

        const res = await createListing({
          id: listingId,
          title,
          description,
          category,
          condition: condition as ItemConditionValue,
          price: parseFloat(price) || 0,
          imagePath,
        });

        if (!res.ok) {
          setErrorMessage(res.error);
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        } else {
          router.push(`/app/marketplace/${res.data.id}` as Route);
        }
      } catch (err: unknown) {
        console.error("Listing creation error:", err);
        setErrorMessage(err instanceof Error ? err.message : "Failed to publish listing.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Item Photograph (Recommended)
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Upload a clear photograph of the item (JPEG, PNG, or WebP, up to 5 MB).
        </p>

        <div className="mt-3">
          {previewUrl ? (
            <div className="relative aspect-[16/9] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image src={previewUrl} alt="Listing preview" fill className="object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-lg bg-slate-900/70 p-1.5 text-white transition hover:bg-slate-900"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex max-w-sm cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition hover:border-brand hover:bg-brand/5"
            >
              <Upload className="size-8 text-slate-400" />
              <span className="mt-2 text-xs font-bold text-slate-700">Click to upload photo</span>
              <span className="mt-1 text-[11px] text-slate-400">PNG, JPG or WebP up to 5MB</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-ink">Item Details</h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Listing Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Casio fx-991EX Scientific Calculator / Semester 3 Data Structures Textbook"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
          />
          {fieldErrors.title && <p className="mt-1 text-xs text-rose-600">{fieldErrors.title[0]}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {fieldErrors.category && <p className="mt-1 text-xs text-rose-600">{fieldErrors.category[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Price (INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <IndianRupee className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className="h-11 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
              />
            </div>
            {fieldErrors.price && <p className="mt-1 text-xs text-rose-600">{fieldErrors.price[0]}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Item Condition <span className="text-rose-500">*</span>
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ITEM_CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => setCondition(cond.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  condition === cond.value
                    ? "border-brand bg-brand/5 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-xs font-bold text-ink">{cond.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Description & Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item's condition, age, reasons for selling, and preferred campus pickup location."
            className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
          />
          {fieldErrors.description && <p className="mt-1 text-xs text-rose-600">{fieldErrors.description[0]}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
          Publish Listing
        </button>
      </div>
    </form>
  );
}
