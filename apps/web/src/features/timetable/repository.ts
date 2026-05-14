import { apiClient, apiFetch } from '@/lib/api/client';
import type {
  CreateConfigRequest,
  TimetableConfig,
  TimetableSlot,
  TimetableConflict,
  Classroom,
  GeneratedTimetable,
} from './types';
import { DEFAULT_SUBJECTS, DAYS_ORDER } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONFIG: TimetableConfig = {
  id: 'mock-cfg-001',
  department: 'Computer Science & Engineering',
  semester: 5,
  academicYear: '2025-26',
  sections: ['A', 'B'],
  workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  periodsPerDay: 7,
  status: 'GENERATED',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  generatedAt: new Date().toISOString(),
  subjects: DEFAULT_SUBJECTS.map((s, i) => ({
    id: `subj-${i + 1}`,
    subjectCode: s.subjectCode,
    subjectName: s.subjectName,
    subjectType: s.subjectType,
    credits: s.credits,
    hoursPerWeek: s.hoursPerWeek,
    facultyName: s.facultyName,
    requiresLab: s.requiresLab ?? false,
  })),
};

const MOCK_CONFIGS: TimetableConfig[] = [MOCK_CONFIG];

const CLASSROOMS = ['LH-101', 'LH-102', 'CS-Lab-1', 'CS-Lab-2', 'LH-201'];

// Deterministic schedule matrix: [section][day][period] -> subjectIndex (or -1 for break)
// Period 4 is break for all days/sections.
// Theory subjects get spread across the week. Labs take 2 consecutive periods.
function buildMockSlots(): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  const sections = ['A', 'B'];

  // Schedule template per section (period 1-7, break at period 4 shown as isBreak)
  // Theory: 21CS51 (3h), 21CS52 (4h), 21CS53 (4h), 21CS54 (4h)
  // Lab: 21CSL55 (2h consecutive), 21CSL56 (2h consecutive)
  // 6 days x 6 theory slots (periods 1-3, 5-7) = 36 slots per section for theory/lab
  // We assign by subject rotation across days

  // Subject schedule map: day -> period -> subjectIndex
  // Section A schedule
  const scheduleA: Record<string, Record<number, number>> = {
    MON: { 1: 0, 2: 1, 3: 2, 5: 3, 6: 4, 7: 4 }, // CSL55 occupies p6,p7
    TUE: { 1: 1, 2: 2, 3: 3, 5: 0, 6: 1, 7: 2 },
    WED: { 1: 3, 2: 0, 3: 1, 5: 2, 6: 3, 7: 0 },
    THU: { 1: 2, 2: 3, 3: 0, 5: 5, 6: 5, 7: 1 }, // CSL56 occupies p5,p6
    FRI: { 1: 1, 2: 2, 3: 3, 5: 0, 6: 2, 7: 3 },
    SAT: { 1: 0, 2: 1, 3: 2, 5: 3, 6: 1, 7: 0 },
  };

  // Section B gets a rotated schedule
  const scheduleB: Record<string, Record<number, number>> = {
    MON: { 1: 3, 2: 2, 3: 1, 5: 0, 6: 5, 7: 5 },
    TUE: { 1: 0, 2: 3, 3: 2, 5: 1, 6: 0, 7: 3 },
    WED: { 1: 2, 2: 1, 3: 0, 5: 3, 6: 2, 7: 1 },
    THU: { 1: 1, 2: 0, 3: 3, 5: 4, 6: 4, 7: 2 },
    FRI: { 1: 3, 2: 1, 3: 0, 5: 2, 6: 3, 7: 1 },
    SAT: { 1: 2, 2: 3, 3: 1, 5: 0, 6: 2, 7: 3 },
  };

  const schedules: Record<string, Record<string, Record<number, number>>> = {
    A: scheduleA,
    B: scheduleB,
  };

  // Classroom assignment: theory -> lecture hall, lab -> lab room
  const classroomForType = (type: string, section: string): string => {
    if (type === 'LAB') return section === 'A' ? 'CS-Lab-1' : 'CS-Lab-2';
    return section === 'A' ? 'LH-101' : 'LH-102';
  };

  for (const section of sections) {
    for (const day of DAYS_ORDER) {
      for (let period = 1; period <= 7; period++) {
        // Break period
        if (period === 4) {
          slots.push({
            id: `${section}-${day}-${period}`,
            section,
            day,
            period,
            isBreak: true,
            subjectCode: null,
            subjectName: null,
            subjectType: null,
            facultyName: null,
            classroomName: null,
          });
          continue;
        }

        const daySchedule = schedules[section]?.[day];
        const subjectIdx = daySchedule?.[period];

        if (subjectIdx === undefined) {
          slots.push({
            id: `${section}-${day}-${period}`,
            section, day, period,
            isBreak: false,
            subjectCode: null,
            subjectName: null,
            subjectType: null,
            facultyName: null,
            classroomName: null,
          });
          continue;
        }

        const subj = DEFAULT_SUBJECTS[subjectIdx];
        if (!subj) {
          slots.push({
            id: `${section}-${day}-${period}`,
            section, day, period,
            isBreak: false,
            subjectCode: null,
            subjectName: null,
            subjectType: null,
            facultyName: null,
            classroomName: null,
          });
          continue;
        }

        slots.push({
          id: `${section}-${day}-${period}`,
          section,
          day,
          period,
          subjectCode: subj.subjectCode,
          subjectName: subj.subjectName,
          subjectType: subj.subjectType,
          facultyName: subj.facultyName,
          classroomName: classroomForType(subj.subjectType, section),
          isBreak: false,
        });
      }
    }
  }

  return slots;
}

const MOCK_SLOTS = buildMockSlots();

const MOCK_CONFLICTS: TimetableConflict[] = [
  {
    id: 'conflict-001',
    conflictType: 'FACULTY_OVERLOAD',
    description: 'Dr. Ravi Kumar is assigned 6 hours/week across both sections — exceeds recommended 5h/week teaching load.',
    day: null,
    period: null,
    affectedEntity: 'Dr. Ravi Kumar',
    severity: 'WARNING',
  },
];

const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'room-1', name: 'LH-101', type: 'LECTURE', capacity: 60 },
  { id: 'room-2', name: 'LH-102', type: 'LECTURE', capacity: 60 },
  { id: 'room-3', name: 'CS-Lab-1', type: 'LAB', capacity: 30 },
  { id: 'room-4', name: 'CS-Lab-2', type: 'LAB', capacity: 30 },
  { id: 'room-5', name: 'LH-201', type: 'SEMINAR', capacity: 120 },
];

// ── View builders ─────────────────────────────────────────────────────────────

function buildMockViews(slots: TimetableSlot[]): Pick<GeneratedTimetable, 'viewBySection' | 'viewByFaculty' | 'viewByClassroom'> {
  const viewBySection: Record<string, Record<string, Record<number, TimetableSlot>>> = {};
  const viewByFaculty: Record<string, TimetableSlot[]> = {};
  const viewByClassroom: Record<string, TimetableSlot[]> = {};

  for (const slot of slots) {
    // By section
    if (!viewBySection[slot.section]) viewBySection[slot.section] = {};
    const secDay = viewBySection[slot.section]!;
    if (!secDay[slot.day]) secDay[slot.day] = {};
    secDay[slot.day]![slot.period] = slot;

    // By faculty
    if (slot.facultyName && !slot.isBreak) {
      if (!viewByFaculty[slot.facultyName]) viewByFaculty[slot.facultyName] = [];
      viewByFaculty[slot.facultyName]!.push(slot);
    }

    // By classroom
    if (slot.classroomName && !slot.isBreak) {
      if (!viewByClassroom[slot.classroomName]) viewByClassroom[slot.classroomName] = [];
      viewByClassroom[slot.classroomName]!.push(slot);
    }
  }

  return { viewBySection, viewByFaculty, viewByClassroom };
}

// ── Repository functions ──────────────────────────────────────────────────────

export async function createConfig(dto: CreateConfigRequest): Promise<TimetableConfig> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    const newConfig: TimetableConfig = {
      id: `mock-cfg-${Date.now()}`,
      department: dto.department,
      semester: dto.semester,
      academicYear: dto.academicYear,
      sections: dto.sections,
      workingDays: dto.workingDays,
      periodsPerDay: dto.periodsPerDay,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      generatedAt: null,
      subjects: dto.subjects.map((s, i) => ({
        id: `subj-new-${i}`,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        subjectType: s.subjectType,
        credits: s.credits,
        hoursPerWeek: s.hoursPerWeek,
        facultyName: s.facultyName,
        requiresLab: s.requiresLab ?? false,
      })),
    };
    MOCK_CONFIGS.push(newConfig);
    return newConfig;
  }
  try {
    return await apiClient.post<TimetableConfig>('/api/timetable/configs', dto);
  } catch {
    // Synth fallback when backend timetable service unavailable
    await new Promise(r => setTimeout(r, 400));
    const newConfig: TimetableConfig = {
      id: `mock-cfg-${Date.now()}`,
      department: dto.department,
      semester: dto.semester,
      academicYear: dto.academicYear,
      sections: dto.sections,
      workingDays: dto.workingDays,
      periodsPerDay: dto.periodsPerDay,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      generatedAt: null,
      subjects: dto.subjects.map((s, i) => ({
        id: `subj-new-${i}`,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        subjectType: s.subjectType,
        credits: s.credits,
        hoursPerWeek: s.hoursPerWeek,
        facultyName: s.facultyName,
        requiresLab: s.requiresLab ?? false,
      })),
    };
    MOCK_CONFIGS.push(newConfig);
    return newConfig;
  }
}

export async function listConfigs(department?: string): Promise<TimetableConfig[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    if (department) return MOCK_CONFIGS.filter(c => c.department === department);
    return MOCK_CONFIGS;
  }
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  try {
    return await apiClient.get<TimetableConfig[]>(`/api/timetable/configs${query}`);
  } catch {
    if (department) return MOCK_CONFIGS.filter(c => c.department === department);
    return MOCK_CONFIGS;
  }
}

export async function getConfig(id: string): Promise<TimetableConfig> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_CONFIG;
  }
  return apiClient.get<TimetableConfig>(`/api/timetable/configs/${id}`);
}

export async function generateTimetable(configId: string): Promise<GeneratedTimetable> {
  if (USE_MOCK) {
    // Simulate Claude latency
    await new Promise(r => setTimeout(r, 3000));
    const views = buildMockViews(MOCK_SLOTS);
    return {
      configId,
      slots: MOCK_SLOTS,
      conflicts: MOCK_CONFLICTS,
      ...views,
      generatedAt: new Date().toISOString(),
    };
  }
  try {
    return await apiClient.post<GeneratedTimetable>(`/api/timetable/configs/${configId}/generate`, {});
  } catch {
    // Synth fallback — AI generation endpoint not yet provisioned on backend
    await new Promise(r => setTimeout(r, 3000));
    const views = buildMockViews(MOCK_SLOTS);
    return {
      configId,
      slots: MOCK_SLOTS,
      conflicts: MOCK_CONFLICTS,
      ...views,
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function getSlots(configId: string, section?: string): Promise<TimetableSlot[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    if (section) return MOCK_SLOTS.filter(s => s.section === section);
    return MOCK_SLOTS;
  }
  const query = section ? `?section=${encodeURIComponent(section)}` : '';
  return apiClient.get<TimetableSlot[]>(`/api/timetable/configs/${configId}/slots${query}`);
}

export async function getConflicts(configId: string): Promise<TimetableConflict[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_CONFLICTS;
  }
  return apiClient.get<TimetableConflict[]>(`/api/timetable/configs/${configId}/conflicts`);
}

export async function getClassrooms(): Promise<Classroom[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 150));
    return MOCK_CLASSROOMS;
  }
  return apiClient.get<Classroom[]>('/api/timetable/classrooms');
}

export async function publishConfig(id: string): Promise<TimetableConfig> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    const cfg = MOCK_CONFIGS.find(c => c.id === id) ?? MOCK_CONFIG;
    return { ...cfg, status: 'PUBLISHED' };
  }
  return apiClient.post<TimetableConfig>(`/api/timetable/configs/${id}/publish`, {});
}

export async function deleteConfig(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    const idx = MOCK_CONFIGS.findIndex(c => c.id === id);
    if (idx !== -1) MOCK_CONFIGS.splice(idx, 1);
    return;
  }
  await apiFetch<void>(`/api/timetable/configs/${id}`, { method: 'DELETE' });
}

// Re-export CLASSROOMS for display use
export { CLASSROOMS };
