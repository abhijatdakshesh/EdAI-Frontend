'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/shell';
import {
  createConfig,
  listConfigs,
  generateTimetable,
  publishConfig,
} from './repository';
import type {
  TimetableConfig,
  TimetableSubjectInput,
  GeneratedTimetable,
  TimetableView,
  TimetableSlot,
} from './types';
import {
  DEFAULT_SUBJECTS,
  DAYS_ORDER,
  DAY_LABELS,
  SUBJECT_COLORS,
} from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastNameOf(full: string | null | undefined): string {
  if (!full) return '';
  const parts = full.trim().split(' ');
  return parts[parts.length - 1] ?? full;
}

function subjectColor(code: string | null | undefined, codes: string[]): string {
  if (!code) return '#F9F7F4';
  const idx = codes.indexOf(code);
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length] ?? '#F9F7F4';
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT:     { bg: '#F0EDE8', text: '#6B6358', label: 'Draft' },
    GENERATED: { bg: '#E6EEF5', text: '#2F567A', label: 'Generated' },
    PUBLISHED: { bg: '#EBF3EE', text: '#3D6B4F', label: 'Published' },
  };
  const s = map[status] ?? map['DRAFT'];
  return (
    <span
      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: s?.bg, color: s?.text }}
    >
      {s?.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  const bg = type === 'success' ? '#EBF3EE' : '#F5E6E6';
  const text = type === 'success' ? '#3D6B4F' : '#8B2F2F';
  return (
    <div
      className="fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-xl z-50 text-sm font-medium border"
      style={{ background: bg, color: text, borderColor: text + '33' }}
    >
      {message}
    </div>
  );
}

// ── List stage ────────────────────────────────────────────────────────────────

function ListStage({
  configs,
  loading,
  onNew,
  onSelect,
}: {
  configs: TimetableConfig[];
  loading: boolean;
  onNew: () => void;
  onSelect: (cfg: TimetableConfig) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Timetable Generator</h1>
          <p className="text-sm text-[#6B6358] mt-0.5">AI-powered timetable scheduling with conflict resolution</p>
        </div>
        <button
          onClick={onNew}
          className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors"
        >
          + New Timetable
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && configs.length === 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-12 text-center">
          <div className="text-3xl mb-3">✦</div>
          <p className="font-medium text-[#1a1a1a]">No timetables yet</p>
          <p className="text-sm text-[#6B6358] mt-1">Generate your first AI-powered timetable to get started.</p>
          <button
            onClick={onNew}
            className="mt-4 px-5 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors"
          >
            + New Timetable
          </button>
        </div>
      )}

      {!loading && configs.length > 0 && (
        <div className="grid gap-3">
          {configs.map(cfg => (
            <div
              key={cfg.id}
              onClick={() => onSelect(cfg)}
              className="bg-white border border-[#E5E0D8] rounded-xl p-5 cursor-pointer hover:border-[#C5BFB5] hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-[#1a1a1a]">{cfg.department}</div>
                  <div className="text-sm text-[#6B6358] mt-1">
                    Semester {cfg.semester} &middot; {cfg.academicYear} &middot; Sections {cfg.sections.join(', ')}
                  </div>
                  <div className="text-xs text-[#A89F94] mt-1">
                    {cfg.workingDays.length} working days &middot; {cfg.periodsPerDay} periods/day
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <StatusBadge status={cfg.status} />
                  {cfg.generatedAt && (
                    <span className="text-xs text-[#A89F94]">
                      Generated {new Date(cfg.generatedAt).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Subject row ───────────────────────────────────────────────────────────────

function SubjectRow({
  subject,
  index,
  onChange,
  onDelete,
}: {
  subject: TimetableSubjectInput;
  index: number;
  onChange: (i: number, updated: TimetableSubjectInput) => void;
  onDelete: (i: number) => void;
}) {
  const set = (field: keyof TimetableSubjectInput, value: unknown) => {
    onChange(index, { ...subject, [field]: value });
  };

  return (
    <tr className="border-t border-[#F0EDE8]">
      <td className="py-2 px-3">
        <input
          value={subject.subjectCode}
          onChange={e => set('subjectCode', e.target.value)}
          className="w-full text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1a1a1a]"
          placeholder="21CS51"
        />
      </td>
      <td className="py-2 px-3">
        <input
          value={subject.subjectName}
          onChange={e => set('subjectName', e.target.value)}
          className="w-full text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1a1a1a]"
          placeholder="Subject Name"
        />
      </td>
      <td className="py-2 px-3">
        <select
          value={subject.subjectType}
          onChange={e => set('subjectType', e.target.value as TimetableSubjectInput['subjectType'])}
          className="w-full text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#1a1a1a]"
        >
          <option value="THEORY">Theory</option>
          <option value="LAB">Lab</option>
          <option value="ELECTIVE">Elective</option>
        </select>
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          min={1}
          max={6}
          value={subject.credits}
          onChange={e => set('credits', Number(e.target.value))}
          className="w-16 text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1a1a1a]"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          min={1}
          max={10}
          value={subject.hoursPerWeek}
          onChange={e => set('hoursPerWeek', Number(e.target.value))}
          className="w-16 text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1a1a1a]"
        />
      </td>
      <td className="py-2 px-3">
        <input
          value={subject.facultyName}
          onChange={e => set('facultyName', e.target.value)}
          className="w-full text-xs border border-[#E5E0D8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1a1a1a]"
          placeholder="Faculty Name"
        />
      </td>
      <td className="py-2 px-3 text-center">
        <button
          onClick={() => onDelete(index)}
          className="text-[#8B2F2F] hover:text-red-700 text-sm"
          title="Remove subject"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ── Form stage ────────────────────────────────────────────────────────────────

const ALL_WORKING_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function FormStage({
  onGenerate,
  onBack,
}: {
  onGenerate: (result: GeneratedTimetable, config: TimetableConfig) => void;
  onBack: () => void;
}) {
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState(5);
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [sectionsRaw, setSectionsRaw] = useState('A,B');
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  const [periodsPerDay, setPeriodsPerDay] = useState(7);
  const [breakAfterPeriod, setBreakAfterPeriod] = useState(4);
  const [subjects, setSubjects] = useState<TimetableSubjectInput[]>(DEFAULT_SUBJECTS.map(s => ({ ...s })));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubjectChange = (i: number, updated: TimetableSubjectInput) => {
    setSubjects(prev => prev.map((s, idx) => idx === i ? updated : s));
  };

  const handleSubjectDelete = (i: number) => {
    setSubjects(prev => prev.filter((_, idx) => idx !== i));
  };

  const addSubject = () => {
    setSubjects(prev => [
      ...prev,
      { subjectCode: '', subjectName: '', subjectType: 'THEORY', credits: 3, hoursPerWeek: 3, facultyName: '' },
    ]);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!department.trim()) { setError('Department is required.'); return; }
    if (subjects.length === 0) { setError('Add at least one subject.'); return; }
    if (workingDays.length === 0) { setError('Select at least one working day.'); return; }

    setSubmitting(true);
    try {
      const sections = sectionsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const cfg = await createConfig({
        department: department.trim(),
        semester,
        academicYear: academicYear.trim(),
        sections,
        workingDays,
        periodsPerDay,
        periodDurationMinutes: 55,
        breakAfterPeriod,
        createdBy: 'admin',
        subjects,
      });
      const result = await generateTimetable(cfg.id);
      onGenerate(result, cfg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="text-center py-24">
        <div className="w-12 h-12 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p className="font-medium text-[#1a1a1a]">Claude is solving your timetable...</p>
        <p className="text-sm text-[#6B6358] mt-2">This may take up to 30 seconds</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-[#6B6358] hover:text-[#1a1a1a] transition-colors"
        >
          &larr; Back
        </button>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">New Timetable Configuration</h1>
      </div>

      {error && (
        <div className="bg-[#F5E6E6] text-[#8B2F2F] text-sm px-4 py-3 rounded-xl border border-[#8B2F2F33]">
          {error}
        </div>
      )}

      {/* Basic config card */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4">Basic Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Department</label>
            <input
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a]"
              placeholder="Computer Science & Engineering"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Semester</label>
            <select
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-[#1a1a1a]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Academic Year</label>
            <input
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a]"
              placeholder="2025-26"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Sections (comma-separated)</label>
            <input
              value={sectionsRaw}
              onChange={e => setSectionsRaw(e.target.value)}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a]"
              placeholder="A,B"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Periods per Day</label>
            <input
              type="number"
              min={4}
              max={10}
              value={periodsPerDay}
              onChange={e => setPeriodsPerDay(Number(e.target.value))}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B6358] font-medium block mb-1.5">Break After Period</label>
            <input
              type="number"
              min={1}
              max={periodsPerDay - 1}
              value={breakAfterPeriod}
              onChange={e => setBreakAfterPeriod(Number(e.target.value))}
              className="w-full text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-[#6B6358] font-medium block mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_WORKING_DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  workingDays.includes(day)
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#6B6358] border-[#E5E0D8] hover:border-[#C5BFB5]'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subjects card */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Subjects</h2>
          <button
            onClick={addSubject}
            className="text-xs px-3 py-1.5 border border-[#E5E0D8] rounded-lg text-[#6B6358] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
          >
            + Add Subject
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs text-[#6B6358] text-left">
                <th className="pb-3 px-3 font-medium w-28">Code</th>
                <th className="pb-3 px-3 font-medium">Name</th>
                <th className="pb-3 px-3 font-medium w-28">Type</th>
                <th className="pb-3 px-3 font-medium w-16">Credits</th>
                <th className="pb-3 px-3 font-medium w-16">Hrs/Wk</th>
                <th className="pb-3 px-3 font-medium">Faculty</th>
                <th className="pb-3 px-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj, i) => (
                <SubjectRow
                  key={i}
                  subject={subj}
                  index={i}
                  onChange={handleSubjectChange}
                  onDelete={handleSubjectDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
        {subjects.length === 0 && (
          <p className="text-sm text-[#A89F94] text-center py-6">No subjects added. Click &quot;+ Add Subject&quot; to begin.</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          ✦ Generate Timetable with AI
        </button>
      </div>
    </div>
  );
}

// ── Timetable grid cell ───────────────────────────────────────────────────────

function SlotCell({ slot, colorMap }: { slot: TimetableSlot | undefined; colorMap: Record<string, string> }) {
  if (!slot) {
    return <td className="border border-[#F0EDE8] p-2 text-center text-xs text-[#C5BFB5]">—</td>;
  }

  if (slot.isBreak) {
    return (
      <td className="border border-[#F0EDE8] p-2 text-center bg-[#F9F7F4]">
        <span className="text-xs text-[#A89F94]">Lunch</span>
      </td>
    );
  }

  if (!slot.subjectCode) {
    return <td className="border border-[#F0EDE8] p-2 text-center text-xs text-[#C5BFB5]">—</td>;
  }

  const color = colorMap[slot.subjectCode] ?? '#F9F7F4';
  const isLab = slot.subjectType === 'LAB';

  return (
    <td className="border border-[#F0EDE8] p-1.5 min-w-[100px]" style={{ background: color }}>
      <div className="text-xs">
        <div className="font-semibold text-[#1a1a1a] truncate">
          {isLab ? '🔬 ' : ''}{slot.subjectCode}
        </div>
        <div className="text-[#6B6358] truncate">{lastNameOf(slot.facultyName)}</div>
        {slot.classroomName && (
          <div className="text-[#A89F94] text-[10px] truncate">{slot.classroomName}</div>
        )}
      </div>
    </td>
  );
}

// ── Section view ──────────────────────────────────────────────────────────────

function SectionView({
  result,
  periodsPerDay,
  workingDays,
}: {
  result: GeneratedTimetable;
  periodsPerDay: number;
  workingDays: string[];
}) {
  const sections = Object.keys(result.viewBySection);
  const [activeSection, setActiveSection] = useState(sections[0] ?? 'A');

  // Build color map from unique subject codes
  const allCodes = [...new Set(
    result.slots.filter(s => s.subjectCode).map(s => s.subjectCode as string)
  )];
  const colorMap: Record<string, string> = {};
  allCodes.forEach((code, i) => {
    colorMap[code] = SUBJECT_COLORS[i % SUBJECT_COLORS.length] ?? '#F9F7F4';
  });

  const days = workingDays.filter(d => DAYS_ORDER.includes(d));
  const sectionData = result.viewBySection[activeSection] ?? {};

  const periods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  return (
    <div>
      {/* Section chips */}
      <div className="flex gap-2 mb-4">
        {sections.map(sec => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium border transition-colors ${
              activeSection === sec
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#6B6358] border-[#E5E0D8] hover:border-[#C5BFB5]'
            }`}
          >
            Section {sec}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-[#F0EDE8] p-2 text-xs font-medium text-[#6B6358] bg-[#F9F7F4] w-16">Period</th>
              {days.map(day => (
                <th key={day} className="border border-[#F0EDE8] p-2 text-xs font-medium text-[#6B6358] bg-[#F9F7F4]">
                  {DAY_LABELS[day] ?? day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period}>
                <td className="border border-[#F0EDE8] p-2 text-center text-xs font-medium text-[#6B6358] bg-[#F9F7F4]">
                  P{period}
                </td>
                {days.map(day => {
                  const slot = sectionData[day]?.[period];
                  return <SlotCell key={day} slot={slot} colorMap={colorMap} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {allCodes.map(code => {
          const slot = result.slots.find(s => s.subjectCode === code);
          return (
            <div key={code} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: colorMap[code] }} />
              <span className="text-xs text-[#6B6358]">{code} — {slot?.subjectName ?? code}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Faculty view ──────────────────────────────────────────────────────────────

function FacultyView({ result }: { result: GeneratedTimetable }) {
  const entries = Object.entries(result.viewByFaculty);

  if (entries.length === 0) {
    return <p className="text-sm text-[#A89F94] py-8 text-center">No faculty schedule data available.</p>;
  }

  return (
    <div className="grid gap-4">
      {entries.map(([faculty, slots]) => (
        <div key={faculty} className="bg-[#F9F7F4] rounded-xl p-4">
          <div className="font-medium text-[#1a1a1a] text-sm mb-3">{faculty}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs">
                <span className="font-medium text-[#1a1a1a]">
                  {slot.day} P{slot.period}
                </span>
                <span className="text-[#6B6358] mx-1">&middot;</span>
                <span className="text-[#1a1a1a]">{slot.subjectName ?? slot.subjectCode}</span>
                {slot.section && (
                  <>
                    <span className="text-[#6B6358] mx-1">&middot;</span>
                    <span className="text-[#6B6358]">Sec {slot.section}</span>
                  </>
                )}
                {slot.classroomName && (
                  <>
                    <span className="text-[#6B6358] mx-1">&middot;</span>
                    <span className="text-[#A89F94]">{slot.classroomName}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Classroom view ────────────────────────────────────────────────────────────

function ClassroomView({ result }: { result: GeneratedTimetable }) {
  const entries = Object.entries(result.viewByClassroom);

  if (entries.length === 0) {
    return <p className="text-sm text-[#A89F94] py-8 text-center">No classroom schedule data available.</p>;
  }

  return (
    <div className="grid gap-4">
      {entries.map(([room, slots]) => (
        <div key={room} className="bg-[#F9F7F4] rounded-xl p-4">
          <div className="font-medium text-[#1a1a1a] text-sm mb-3">{room}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs">
                <span className="font-medium text-[#1a1a1a]">
                  {slot.day} P{slot.period}
                </span>
                <span className="text-[#6B6358] mx-1">&middot;</span>
                <span className="text-[#1a1a1a]">{slot.subjectName ?? slot.subjectCode}</span>
                {slot.section && (
                  <>
                    <span className="text-[#6B6358] mx-1">&middot;</span>
                    <span className="text-[#6B6358]">Sec {slot.section}</span>
                  </>
                )}
                {slot.facultyName && (
                  <>
                    <span className="text-[#6B6358] mx-1">&middot;</span>
                    <span className="text-[#A89F94]">{lastNameOf(slot.facultyName)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Conflicts panel ───────────────────────────────────────────────────────────

function ConflictsPanel({ result }: { result: GeneratedTimetable }) {
  if (result.conflicts.length === 0) return null;

  const errors = result.conflicts.filter(c => c.severity === 'ERROR');
  const warnings = result.conflicts.filter(c => c.severity === 'WARNING');

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-[#1a1a1a]">Conflicts</span>
        {errors.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5E6E6] text-[#8B2F2F] font-medium">
            {errors.length} error{errors.length > 1 ? 's' : ''}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF3CD] text-[#8B6914] font-medium">
            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {result.conflicts.map((conflict, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5"
              style={
                conflict.severity === 'ERROR'
                  ? { background: '#F5E6E6', color: '#8B2F2F' }
                  : { background: '#FFF3CD', color: '#8B6914' }
              }
            >
              {conflict.severity}
            </span>
            <div className="text-sm text-[#1a1a1a]">
              {conflict.description}
              {(conflict.day || conflict.period) && (
                <span className="text-xs text-[#A89F94] ml-2">
                  {conflict.day && `${conflict.day} `}
                  {conflict.period && `P${conflict.period}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Result stage ──────────────────────────────────────────────────────────────

function ResultStage({
  result,
  config,
  onRegenerate,
  onNewConfig,
}: {
  result: GeneratedTimetable;
  config: TimetableConfig;
  onRegenerate: () => void;
  onNewConfig: () => void;
}) {
  const [activeView, setActiveView] = useState<TimetableView>('section');
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishConfig(result.configId);
      showToast('Timetable published successfully!', 'success');
    } catch {
      showToast('Publish failed. Please try again.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const tabs: { key: TimetableView; label: string }[] = [
    { key: 'section', label: 'By Section' },
    { key: 'faculty', label: 'By Faculty' },
    { key: 'classroom', label: 'By Classroom' },
  ];

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onNewConfig}
              className="text-sm text-[#6B6358] hover:text-[#1a1a1a] transition-colors"
            >
              &larr; New Configuration
            </button>
          </div>
          <div className="mt-1">
            <span className="font-semibold text-[#1a1a1a]">{config.department}</span>
            <span className="text-[#6B6358] text-sm ml-2">
              Sem {config.semester} &middot; {config.academicYear} &middot; Sections {config.sections.join(', ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm border border-[#E5E0D8] rounded-xl text-[#6B6358] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={() => void handlePublish()}
            disabled={publishing}
            className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Tab container */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[#E5E0D8]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeView === tab.key
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-[#6B6358] hover:text-[#1a1a1a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeView === 'section' && (
            <SectionView
              result={result}
              periodsPerDay={config.periodsPerDay}
              workingDays={config.workingDays}
            />
          )}
          {activeView === 'faculty' && <FacultyView result={result} />}
          {activeView === 'classroom' && <ClassroomView result={result} />}
        </div>
      </div>

      <ConflictsPanel result={result} />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

type Stage = 'list' | 'form' | 'generating' | 'result';

export default function TimetableGenerator() {
  const [stage, setStage] = useState<Stage>('list');
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeResult, setActiveResult] = useState<GeneratedTimetable | null>(null);
  const [activeConfig, setActiveConfig] = useState<TimetableConfig | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await listConfigs();
      setConfigs(data);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSelectConfig = async (cfg: TimetableConfig) => {
    setActiveConfig(cfg);
    setStage('generating');
    try {
      const result = await generateTimetable(cfg.id);
      setActiveResult(result);
      setStage('result');
    } catch {
      setStage('list');
    }
  };

  const handleGenerated = (result: GeneratedTimetable, config: TimetableConfig) => {
    setActiveResult(result);
    setActiveConfig(config);
    setStage('result');
    void loadList();
  };

  const handleRegenerate = async () => {
    if (!activeConfig) return;
    setStage('generating');
    try {
      const result = await generateTimetable(activeConfig.id);
      setActiveResult(result);
      setStage('result');
    } catch {
      setStage('result');
    }
  };

  return (
    <AppShell title="AI Timetable Generator">
      {stage === 'list' && (
        <ListStage
          configs={configs}
          loading={loadingList}
          onNew={() => setStage('form')}
          onSelect={cfg => void handleSelectConfig(cfg)}
        />
      )}

      {stage === 'form' && (
        <FormStage
          onGenerate={handleGenerated}
          onBack={() => setStage('list')}
        />
      )}

      {stage === 'generating' && (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="font-medium text-[#1a1a1a]">Claude is solving your timetable...</p>
          <p className="text-sm text-[#6B6358] mt-2">This may take up to 30 seconds</p>
        </div>
      )}

      {stage === 'result' && activeResult && activeConfig && (
        <ResultStage
          result={activeResult}
          config={activeConfig}
          onRegenerate={() => void handleRegenerate()}
          onNewConfig={() => setStage('list')}
        />
      )}
    </AppShell>
  );
}
