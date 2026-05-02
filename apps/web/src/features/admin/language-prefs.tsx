"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/client";

type Lang = "en" | "kn" | "hi" | "ta" | "te" | "ml";

const LANGUAGES: { code: Lang; label: string; nativeName: string; flag: string }[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🏳️" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", flag: "🏳️" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", flag: "🏳️" },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം", flag: "🏳️" },
];

const ROLE_LANG_DEFAULTS: Record<string, Lang> = {
  STUDENT: "en",
  PARENT: "kn",
  FACULTY: "en",
  ADMIN: "en",
};

export function LanguagePreferences() {
  const [systemDefault, setSystemDefault] = useState<Lang>("en");
  const [roleDefaults, setRoleDefaults] = useState<Record<string, Lang>>(ROLE_LANG_DEFAULTS);
  const [aiCallLang, setAiCallLang] = useState<Lang[]>(["kn", "en"]);

  const saveMutation = useMutation({
    mutationFn: () => apiPost<void>("/api/admin/language", { systemDefault, roleDefaults, aiCallLang }),
  });

  const toggleAiLang = (code: Lang) => {
    setAiCallLang(prev =>
      prev.includes(code) ? prev.filter(l=>l!==code) : [...prev, code]
    );
  };

  return (
    <AppShell title="Language Preferences">
      <div className="grid gap-6 max-w-3xl">
        {/* System default */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">System Default Language</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LANGUAGES.map(lang=>(
              <button key={lang.code} onClick={()=>setSystemDefault(lang.code)}
                className={cn("rounded border p-3 text-left transition-colors",
                  systemDefault===lang.code ? "border-[#1C1810] bg-cream-100" : "border-border hover:border-[#1C1810]")}>
                <span className="text-xl">{lang.flag}</span>
                <p className="font-medium text-sm mt-1">{lang.label}</p>
                <p className="text-xs text-text-muted">{lang.nativeName}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Per-role defaults */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Default Language by Role</p>
          <div className="grid gap-3">
            {Object.entries(roleDefaults).map(([role, lang])=>(
              <div key={role} className="flex items-center justify-between">
                <p className="text-sm font-medium">{role}</p>
                <select value={lang} onChange={e=>setRoleDefaults(r=>({...r,[role]:e.target.value as Lang}))}
                  className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                  {LANGUAGES.map(l=>(
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* AI Voice call languages */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-1">AI Voice Call Languages</p>
          <p className="text-xs text-text-muted mb-4">Languages available for automated parent calls. The system will use the parent&apos;s preferred language if set.</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang=>(
              <button key={lang.code} onClick={()=>toggleAiLang(lang.code)}
                className={cn("rounded border px-3 py-1.5 text-sm transition-colors",
                  aiCallLang.includes(lang.code) ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">{aiCallLang.length} language(s) enabled for AI calls</p>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-[#8B2F2F]">Save failed: {(saveMutation.error as Error).message}</p>
        )}
        <div className="flex gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : saveMutation.isSuccess ? "✓ Saved" : "Save Preferences"}
          </Button>
          <Button variant="outline" onClick={() => { setSystemDefault("en"); setRoleDefaults(ROLE_LANG_DEFAULTS); setAiCallLang(["kn", "en"]); }}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
