export type SlotType = 'THEORY' | 'LAB' | 'ELECTIVE' | 'BREAK';
export type ConflictSeverity = 'ERROR' | 'WARNING';
export type TimetableStatus = 'DRAFT' | 'GENERATED' | 'PUBLISHED';

export interface TimetableSubjectInput {
  subjectCode: string;
  subjectName: string;
  subjectType: 'THEORY' | 'LAB' | 'ELECTIVE';
  credits: number;
  hoursPerWeek: number;
  facultyName: string;
  requiresLab?: boolean;
}

export interface FacultyConstraintInput {
  facultyName: string;
  unavailableDay?: string;
  unavailablePeriod?: number;
  preferredMorning?: boolean;
}

export interface CreateConfigRequest {
  department: string;
  semester: number;
  academicYear: string;
  sections: string[];
  workingDays: string[];
  periodsPerDay: number;
  periodDurationMinutes: number;
  breakAfterPeriod: number;
  createdBy: string;
  subjects: TimetableSubjectInput[];
  facultyConstraints?: FacultyConstraintInput[];
}

export interface TimetableConfig {
  id: string;
  department: string;
  semester: number;
  academicYear: string;
  sections: string[];
  workingDays: string[];
  periodsPerDay: number;
  status: TimetableStatus;
  createdAt: string;
  generatedAt?: string | null;
  subjects?: TimetableSubjectRow[];
}

export interface TimetableSubjectRow {
  id: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  credits: number;
  hoursPerWeek: number;
  facultyName: string;
  requiresLab: boolean;
}

export interface TimetableSlot {
  id?: string;
  section: string;
  day: string;
  period: number;
  subjectCode?: string | null;
  subjectName?: string | null;
  subjectType?: string | null;
  facultyName?: string | null;
  classroomName?: string | null;
  isBreak: boolean;
}

export interface TimetableConflict {
  id?: string;
  conflictType: string;
  description: string;
  day?: string | null;
  period?: number | null;
  affectedEntity?: string | null;
  severity: ConflictSeverity;
}

export interface Classroom {
  id: string;
  name: string;
  type: 'LECTURE' | 'LAB' | 'SEMINAR';
  capacity?: number;
}

export interface GeneratedTimetable {
  configId: string;
  slots: TimetableSlot[];
  conflicts: TimetableConflict[];
  viewBySection: Record<string, Record<string, Record<number, TimetableSlot>>>;
  viewByFaculty: Record<string, TimetableSlot[]>;
  viewByClassroom: Record<string, TimetableSlot[]>;
  generatedAt: string;
}

export type TimetableView = 'section' | 'faculty' | 'classroom';

export const DAYS_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

export const SUBJECT_COLORS = [
  '#E6EEF5', '#EBF3EE', '#FFF3CD', '#F5EDDB',
  '#EEE6F5', '#F0EBE8', '#E8EEF5', '#EBF0E8',
];

export const DEFAULT_SUBJECTS: TimetableSubjectInput[] = [
  { subjectCode: '21CS51', subjectName: 'Management & Entrepreneurship', subjectType: 'THEORY', credits: 3, hoursPerWeek: 3, facultyName: 'Prof. Anitha Rao' },
  { subjectCode: '21CS52', subjectName: 'Computer Networks', subjectType: 'THEORY', credits: 4, hoursPerWeek: 4, facultyName: 'Dr. Ravi Kumar' },
  { subjectCode: '21CS53', subjectName: 'Database Management Systems', subjectType: 'THEORY', credits: 4, hoursPerWeek: 4, facultyName: 'Dr. Priya Sharma' },
  { subjectCode: '21CS54', subjectName: 'Operating Systems', subjectType: 'THEORY', credits: 4, hoursPerWeek: 4, facultyName: 'Prof. Kiran Bhat' },
  { subjectCode: '21CSL55', subjectName: 'DBMS Lab', subjectType: 'LAB', credits: 1, hoursPerWeek: 2, facultyName: 'Dr. Priya Sharma', requiresLab: true },
  { subjectCode: '21CSL56', subjectName: 'Networks Lab', subjectType: 'LAB', credits: 1, hoursPerWeek: 2, facultyName: 'Dr. Ravi Kumar', requiresLab: true },
];
