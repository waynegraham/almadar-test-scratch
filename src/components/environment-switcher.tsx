"use client";

import { useActionState } from "react";
import { switchEnvironment } from "@/app/actions";
import type { Environment } from "@/lib/config";

export function EnvironmentSwitcher({ environment, cmsUrl }: {
  environment: Environment;
  cmsUrl: string;
}) {
  const [error, action, pending] = useActionState(async (_: string, data: FormData) => {
    try {
      await switchEnvironment(data);
      return "";
    } catch {
      return "Could not switch environment. Please try again.";
    }
  }, "");

  const appearance = {
    staging: { label: "Staging", banner: "border-amber-300 bg-amber-100 text-amber-950", badge: "bg-amber-900 text-white" },
    production: { label: "Production", banner: "border-teal-300 bg-teal-100 text-teal-950", badge: "bg-teal-900 text-white" },
    configured: { label: "Local / configured", banner: "border-slate-300 bg-slate-100 text-slate-950", badge: "bg-slate-800 text-white" },
  }[environment];

  return (
    <div className={`border-b px-5 py-3 text-sm sm:px-8 ${appearance.banner}`}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${appearance.badge}`}>{appearance.label}</span>
        <span className="font-medium">Viewing {appearance.label.toLowerCase()} data</span>
      </div>
      <form action={action} className="flex flex-wrap items-center gap-3" aria-label="Switch environment">
        <label htmlFor="environment" className="font-medium">Environment</label>
        <select key={environment} id="environment" name="environment" defaultValue={environment} disabled={pending} className="border border-stone-300 bg-white px-3 py-2">
          <option value="configured">Local / configured URLs</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
        <button disabled={pending} className="border border-stone-900 bg-stone-900 px-3 py-2 font-medium text-white disabled:opacity-50">
          {pending ? "Switching…" : "Switch"}
        </button>
        <span className="break-all">Current CMS: <span className="font-mono text-xs">{cmsUrl}</span></span>
        <span role="status" className="text-red-700">{error}</span>
      </form>
    </div>
  );
}
