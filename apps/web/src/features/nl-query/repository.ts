import type { NlQueryResponse } from './types';

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'false') === 'true';

const MOCK_RESULT: NlQueryResponse = {
  sql: "SELECT usn AS \"USN\", name AS \"Student Name\", parent_preferred_language AS \"Language\", parent_phone AS \"Parent Phone\" FROM students WHERE institution_id = 'rvce' AND consent_voice = true LIMIT 10",
  columns: ['USN', 'Student Name', 'Language', 'Parent Phone'],
  rows: [
    { USN: '1RV21CS001', 'Student Name': 'Arjun Sharma', Language: 'kn', 'Parent Phone': '+919876543210' },
    { USN: '1RV21CS042', 'Student Name': 'Priya Nair', Language: 'ta', 'Parent Phone': '+919876543211' },
    { USN: '1RV21EC017', 'Student Name': 'Karthik Reddy', Language: 'te', 'Parent Phone': '+919876543212' },
  ],
  rowCount: 3,
};

export const SUGGESTIONS = [
  'Show students with unpaid fees',
  'List students eligible for VTU exam registration',
  'How many AI calls were made this month?',
  'Show students promoted to semester 6 in CSE',
  'List fee items due this month not yet paid',
  'Which students have not given voice call consent?',
  'Show all announcements sent this month',
  'List students with Kannada as preferred language',
];

export async function runNlQuery(query: string): Promise<NlQueryResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 900));
    return MOCK_RESULT;
  }
  const res = await fetch('/api/nl-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<NlQueryResponse>;
}
