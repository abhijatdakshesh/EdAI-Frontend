/**
 * In-memory store for admin academics BFF synth (KAN-37 classes,
 * KAN-32 courses, KAN-48 departments) and automation rules (KAN-52).
 *
 * Single-replica only. SYNTH_OK — TODO replace with proper backend
 * POST routes for /api/classes, /api/courses, /api/departments,
 * /api/automation/rules.
 */

export interface StoredClass {
  id: string;
  name: string;
  departmentCode: string;
  semester: number;
  section: string;
  strength: number;
  classTeacherId: string;
  academicYear: string;
  createdAt: string;
}

export interface StoredCourse {
  id: string;
  code: string;
  name: string;
  departmentCode: string;
  semester: number;
  credits: number;
  type: 'THEORY' | 'LAB' | 'ELECTIVE';
  syllabusUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface StoredDepartment {
  code: string;
  name: string;
  hodUserId: string;
  established: number;
  active: boolean;
  createdAt: string;
}

export interface StoredAutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  actions: string[];
  enabled: boolean;
  runsToday: number;
  lastRun?: string;
  createdAt: string;
}

export const classesStore: StoredClass[] = [];
export const coursesStore: StoredCourse[] = [];
export const departmentsStore: StoredDepartment[] = [];
export const automationRulesStore: StoredAutomationRule[] = [];
