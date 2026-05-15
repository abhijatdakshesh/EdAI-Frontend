/**
 * In-memory LMS synth store — mirrors the demo seed in the backend
 * (services/identity/src/lms/lms.service.ts) so the Next BFF can serve a
 * useful list when the backend is unreachable. Single-replica only.
 * SYNTH_OK.
 */

export type LessonContentKind = 'MARKDOWN' | 'VIDEO' | 'SLIDES' | 'CODE';
export type ProgressState = 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface LessonContentBlock {
  kind: LessonContentKind;
  data: string;
}

export interface CheckpointQuestion {
  q: string;
  options: string[];
  correctIndex: number;
}

export interface StoredModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  published: boolean;
  lessonCount: number;
}

export interface StoredLesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  contentBlocks: LessonContentBlock[];
  checkpoint: CheckpointQuestion[];
  topicTags: string[];
  published: boolean;
}

export interface StoredProgress {
  studentUsn: string;
  lessonId: string;
  state: ProgressState;
  score: number;
  attempts: number;
}

export interface StoredMastery {
  studentUsn: string;
  courseId: string;
  topic: string;
  masteryScore: number;
}

const SAMPLE_CODE = `# FCFS scheduling example
processes = [("P1", 5), ("P2", 3), ("P3", 8)]
time = 0
for name, burst in processes:
    print(f"{name} runs from {time} to {time + burst}")
    time += burst
print(f"Average completion time: {time / len(processes):.1f}")`;

export const lmsModules: StoredModule[] = [
  {
    id: 'mod-os-scheduling',
    courseId: 'CS501',
    title: 'Process Scheduling',
    description: 'How the OS decides which process runs next on the CPU.',
    order: 1,
    published: true,
    lessonCount: 3,
  },
];

export const lmsLessons: StoredLesson[] = [
  {
    id: 'les-fcfs', moduleId: 'mod-os-scheduling', title: 'First-Come First-Served (FCFS)',
    order: 1, published: true, topicTags: ['scheduling', 'fcfs'],
    contentBlocks: [
      { kind: 'MARKDOWN', data: '## FCFS Scheduling\n\nFirst-Come First-Served is the simplest CPU scheduling algorithm. Processes are executed strictly in the order they arrive in the ready queue.\n\n**Pros:** simple, fair in arrival order.\n\n**Cons:** *convoy effect* — one long process delays many short ones.\n\n### Example\nIf P1 (burst 24ms), P2 (3ms), P3 (3ms) arrive in that order, P2 and P3 wait 24ms each despite needing only 3ms.' },
      { kind: 'CODE', data: SAMPLE_CODE },
    ],
    checkpoint: [
      { q: 'FCFS is best described as:', options: ['Preemptive', 'Non-preemptive', 'Round-robin', 'Priority-based'], correctIndex: 1 },
      { q: 'The "convoy effect" means:', options: ['CPU is idle', 'Short jobs wait behind long jobs', 'Disk is slow', 'I/O bound jobs starve'], correctIndex: 1 },
      { q: 'FCFS scheduling order is determined by:', options: ['Burst time', 'Priority', 'Arrival time', 'Random'], correctIndex: 2 },
    ],
  },
  {
    id: 'les-sjf', moduleId: 'mod-os-scheduling', title: 'Shortest Job First (SJF)',
    order: 2, published: true, topicTags: ['scheduling', 'sjf'],
    contentBlocks: [
      { kind: 'MARKDOWN', data: '## Shortest Job First\n\nSJF picks the process with the smallest next CPU burst. Optimal for minimum average waiting time, but predicting the next burst is hard in practice.' },
      { kind: 'VIDEO', data: 'https://www.youtube.com/watch?v=2h3eWaPx8SA' },
    ],
    checkpoint: [
      { q: 'SJF minimises:', options: ['Throughput', 'Avg waiting time', 'CPU util', 'Response time'], correctIndex: 1 },
      { q: 'SJF requires:', options: ['Random selection', 'Knowing burst times in advance', 'Two CPUs', 'Priority list'], correctIndex: 1 },
      { q: 'SJF can be:', options: ['Only preemptive', 'Only non-preemptive', 'Either', 'Neither'], correctIndex: 2 },
    ],
  },
  {
    id: 'les-rr', moduleId: 'mod-os-scheduling', title: 'Round Robin (RR)',
    order: 3, published: true, topicTags: ['scheduling', 'round-robin', 'time-slice'],
    contentBlocks: [
      { kind: 'MARKDOWN', data: '## Round Robin\n\nEach process gets a fixed *time quantum* (e.g. 10ms) then is preempted. Good for interactive systems. Choosing the quantum is the key tuning knob.' },
    ],
    checkpoint: [
      { q: 'Round Robin is:', options: ['Non-preemptive', 'Preemptive', 'Cooperative', 'Manual'], correctIndex: 1 },
      { q: 'A very small time quantum causes:', options: ['Better latency, lower throughput', 'Better throughput', 'CPU starvation', 'Disk thrashing'], correctIndex: 0 },
      { q: 'RR is best for:', options: ['Batch jobs', 'Interactive workloads', 'Real-time only', 'Memory-bound'], correctIndex: 1 },
    ],
  },
];

export const lmsProgress: StoredProgress[] = [];
export const lmsMastery: StoredMastery[] = [];

export function findLesson(id: string): StoredLesson | undefined {
  return lmsLessons.find(l => l.id === id);
}
