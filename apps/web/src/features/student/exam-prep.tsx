"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useMyWellnessScore, useSubmitStressAssessment, useStressResources } from "@/lib/api/counselor";
import { useRouter } from "next/navigation";

const WELLNESS_TIPS = [
  { icon: "😴", title: "Sleep 7–8 Hours", desc: "Adequate sleep consolidates memory and improves recall during exams." },
  { icon: "🏃", title: "Exercise Daily", desc: "Even 20 minutes of walking reduces stress hormones and improves focus." },
  { icon: "🍎", title: "Balanced Diet", desc: "Avoid skipping meals. Brain glucose levels directly affect concentration." },
  { icon: "🧘", title: "Practice Mindfulness", desc: "5-minute breathing exercises before studying improve focus by 30%." },
  { icon: "📵", title: "Digital Detox", desc: "Use app blockers during study sessions to prevent distraction." },
  { icon: "💧", title: "Stay Hydrated", desc: "Dehydration reduces cognitive performance. Aim for 2–3 litres daily." },
];

export function ExamPrepWellness() {
  const router = useRouter();
  const { data: wellness, isLoading } = useMyWellnessScore();
  const submitAssessment = useSubmitStressAssessment();
  const { data: resources = [] } = useStressResources();
  const [selfRating, setSelfRating] = useState<number | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const stressLevel = wellness
    ? Math.round((wellness.score / 100) * 10)
    : selfRating ?? 0;

  async function handleUpdate() {
    if (selfRating === null) return;
    setUpdateMsg(null);
    try {
      await submitAssessment.mutateAsync({ self_stress: selfRating });
      setUpdateMsg("Updated!");
    } catch {
      setUpdateMsg("Failed to update.");
    }
  }

  return (
    <AppShell title="Exam Prep & Wellness">
      <div className="grid gap-6">
        {/* Stress check-in */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-2">Today&apos;s Wellness Check-in</p>
          {isLoading ? (
            <div className="h-10 rounded bg-cream-200 animate-pulse" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Calm</span><span>Stressed</span>
                </div>
                <input
                  type="range" min={0} max={10} step={1}
                  value={selfRating ?? stressLevel}
                  onChange={(e) => setSelfRating(Number(e.target.value))}
                  className="w-full"
                  aria-label="Stress level (0 calm to 10 stressed)"
                />
                <p className="text-xs text-text-muted mt-1">
                  Stress level: {selfRating ?? stressLevel}/10
                  {wellness && <span className="ml-2 text-text-muted">(AI: {wellness.level})</span>}
                </p>
                {updateMsg && (
                  <p className={`text-xs mt-1 ${updateMsg === "Updated!" ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
                    {updateMsg}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline"
                onClick={() => void handleUpdate()}
                disabled={selfRating === null || submitAssessment.isPending}>
                {submitAssessment.isPending ? "Saving…" : "Update"}
              </Button>
            </div>
          )}
          {stressLevel >= 7 && (
            <div className="mt-3 rounded bg-[#FDF5F5] border border-[#F5E6E6] p-3">
              <p className="text-sm text-[#8B2F2F]">Your stress level is high. Consider booking a counsellor session.</p>
              <Button size="sm" className="mt-2" onClick={() => router.push("/student/counselor")}>
                Book Counsellor
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Wellness tips */}
          <div>
            <p className="label-track mb-3">Wellness Tips</p>
            <div className="grid gap-2">
              {WELLNESS_TIPS.map((t) => (
                <div key={t.title} className="rounded border border-border bg-surface p-3 flex gap-3">
                  <span className="text-xl shrink-0" aria-hidden>{t.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-text-muted">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources from API or fallback */}
          <div>
            <p className="label-track mb-3">Mental Health Resources</p>
            {resources.length > 0 ? (
              <div className="grid gap-2">
                {resources.map((r) => (
                  <div key={r.id} className="rounded border border-border bg-surface p-3">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{r.description}</p>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#2F567A] mt-1 inline-block hover:underline">
                        Open →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push("/student/counselor")}>
                  Book Counsellor Session
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("tel:9152987821")}>
                  iCall Helpline
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("tel:18602662345")}>
                  Vandrevala Foundation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
