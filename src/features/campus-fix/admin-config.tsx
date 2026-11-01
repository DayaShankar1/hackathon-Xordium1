"use client";

import { LoaderCircle, Plus, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import type { TableRow } from "@/types/database";

import { addContactScope, saveCategoryRoute, saveContact, saveDepartment } from "./actions";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES } from "./constants";

type Props = {
  contacts: TableRow<"campus_fix_contacts">[];
  departments: TableRow<"campus_fix_departments">[];
  routes: TableRow<"campus_fix_category_routes">[];
  scopes: TableRow<"campus_fix_contact_scopes">[];
};

const fieldClass = "h-10 w-full rounded-xl border border-slate-200 px-3 text-xs";

export function CampusFixAdminConfig({ departments, routes, contacts, scopes }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setPending(true);
    startTransition(async () => {
      const result = await action();
      setPending(false);
      if (!result.ok) return void toast.error(result.error ?? "Action failed.");
      toast.success(success);
      router.refresh();
    });
  }

  function routeSubmit(formData: FormData) {
    run(() => saveCategoryRoute({ category: formData.get("category"), departmentId: formData.get("departmentId"), defaultPriority: formData.get("priority"), isActive: true }), "Category route updated.");
  }
  function departmentSubmit(formData: FormData) {
    run(() => saveDepartment({ code: formData.get("code"), name: formData.get("name"), description: formData.get("description"), defaultSlaHours: Number(formData.get("sla")), isActive: true }), "Department created.");
  }
  function contactSubmit(formData: FormData) {
    run(() => saveContact({ departmentId: formData.get("departmentId"), profileId: formData.get("profileId") || null, staffName: formData.get("staffName"), jobTitle: formData.get("jobTitle"), whatsappNumber: formData.get("whatsappNumber"), whatsappConsent: formData.get("consent") === "on", isActive: true }), "Authorized contact created.");
  }
  function scopeSubmit(formData: FormData) {
    run(() => addContactScope({ contactId: formData.get("contactId"), category: formData.get("category") || null, building: formData.get("building") || null }), "Assignment scope created.");
  }
  function toggleContact(contact: TableRow<"campus_fix_contacts">) {
    run(() => saveContact({ id: contact.id, departmentId: contact.department_id, profileId: contact.profile_id, staffName: contact.staff_name, jobTitle: contact.job_title ?? undefined, whatsappNumber: contact.whatsapp_number ?? "", whatsappConsent: contact.whatsapp_consent, isActive: !contact.is_active }), contact.is_active ? "Contact deactivated." : "Contact activated.");
  }

  return <>
    <section className="mb-5 rounded-[22px] border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-extrabold text-ink">Category routing</h3>
      <form action={routeSubmit} className="mt-4 grid gap-2 sm:grid-cols-4">
        <select name="category" className={fieldClass}>{ISSUE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select name="departmentId" className={fieldClass}>{departments.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="priority" className={fieldClass}>{ISSUE_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <button className="h-10 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Save route</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">{routes.map((route) => <span key={route.category} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600">{ISSUE_CATEGORIES.find((item) => item.value === route.category)?.label} · {route.default_priority}</span>)}</div>
    </section>

    <section className="grid gap-5 xl:grid-cols-3">
      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Departments</h3>
        <form action={departmentSubmit} className="mt-4 space-y-2"><input name="name" required placeholder="Department name" className={fieldClass} /><input name="code" required placeholder="department-code" className={fieldClass} /><input name="description" placeholder="Description" className={fieldClass} /><input name="sla" type="number" min="1" max="720" defaultValue="72" className={fieldClass} /><button disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white"><Plus className="size-3.5" />Add department</button></form>
        <div className="mt-4 space-y-2">{departments.map((department) => <div key={department.id} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-700">{department.name}</p><p className="mt-1 text-slate-400">{department.default_sla_hours}h SLA · {department.is_active ? "Active" : "Inactive"}</p></div>)}</div>
      </article>

      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Authorized contacts</h3>
        <form action={contactSubmit} className="mt-4 space-y-2"><select name="departmentId" required className={fieldClass}><option value="">Department</option>{departments.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="staffName" required placeholder="Staff name" className={fieldClass} /><input name="jobTitle" placeholder="Job title" className={fieldClass} /><input name="profileId" placeholder="Authenticated profile UUID" className={fieldClass} /><input name="whatsappNumber" placeholder="+919876543210" className={fieldClass} /><label className="flex gap-2 text-[11px] text-slate-500"><input type="checkbox" name="consent" />WhatsApp consent verified</label><button disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white"><Plus className="size-3.5" />Add contact</button></form>
        <div className="mt-4 space-y-2">{contacts.map((contact) => <div key={contact.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"><div><p className="font-bold text-slate-700">{contact.staff_name}</p><p className="text-slate-400">{contact.job_title ?? "Maintenance contact"} · {contact.whatsapp_number ?? "No WhatsApp"}</p></div><button onClick={() => toggleContact(contact)} className={`grid size-8 place-items-center rounded-lg ${contact.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500"}`}><Power className="size-3.5" /></button></div>)}</div>
      </article>

      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Contact scopes</h3>
        <form action={scopeSubmit} className="mt-4 space-y-2"><select name="contactId" required className={fieldClass}><option value="">Contact</option>{contacts.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.staff_name}</option>)}</select><select name="category" className={fieldClass}><option value="">All categories</option>{ISSUE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><input name="building" placeholder="Optional exact building" className={fieldClass} /><button disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}Add scope</button></form>
        <div className="mt-4 space-y-2">{scopes.map((scope) => <div key={scope.id} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{ISSUE_CATEGORIES.find((item) => item.value === scope.category)?.label ?? "All categories"}{scope.building ? ` · ${scope.building}` : ""}</div>)}</div>
      </article>
    </section>
  </>;
}
