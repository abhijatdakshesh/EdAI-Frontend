export interface NlQueryResponse {
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface QueryHistoryEntry {
  id: string;
  query: string;
  result: NlQueryResponse;
  executedAt: string;
}
