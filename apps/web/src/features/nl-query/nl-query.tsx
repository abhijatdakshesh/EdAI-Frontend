'use client';

import { useState } from 'react';

import { AppShell } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { runNlQuery, SUGGESTIONS } from './repository';
import type { NlQueryResponse, QueryHistoryEntry } from './types';

function exportCsv(columns: string[], rows: Record<string, unknown>[], filename: string): void {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(esc).join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function ResultsTable({ result }: { result: NlQueryResponse }) {
  const [showSql, setShowSql] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary">
          {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned
        </span>
        <button
          onClick={() => setShowSql((v) => !v)}
          className="text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary"
        >
          {showSql ? 'Hide SQL' : 'Show SQL'}
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportCsv(result.columns, result.rows, `edai-query-${Date.now()}.csv`)}
        >
          Export CSV
        </Button>
      </div>

      {showSql && (
        <pre className="overflow-x-auto rounded border border-border bg-surface p-4 text-xs text-text-secondary whitespace-pre-wrap break-all leading-relaxed">
          {result.sql}
        </pre>
      )}

      {result.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No results found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {result.columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-cream-100 transition-colors">
                  {result.columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {row[col] == null ? (
                        <span className="italic text-text-muted">—</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function NlQuery() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NlQueryResponse | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  async function submit(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await runNlQuery(question);
      setResult(res);
      setHistory((prev) =>
        [{ id: Date.now().toString(), query: question, result: res, executedAt: new Date().toISOString() }, ...prev].slice(0, 10),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed — try rephrasing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Ask Your Data">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Main */}
        <div className="space-y-5">
          {/* Suggestions */}
          <div className="space-y-2">
            <p className="label-track text-xs">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary hover:border-text-primary hover:bg-cream-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit(input); }}
              placeholder="Type a question in plain English… (⌘+Enter to run)"
              rows={3}
              className="w-full resize-none rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-text-primary"
            />
            <Button onClick={() => void submit(input)} disabled={loading || !input.trim()}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating…
                </span>
              ) : (
                'Run Query'
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded bg-[#F5E6E6] px-4 py-3">
              <p className="text-sm font-medium text-[#8B2F2F]">Error</p>
              <p className="mt-0.5 text-xs text-[#8B2F2F]">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && <ResultsTable result={result} />}
        </div>

        {/* History */}
        <div className="space-y-2">
          <p className="label-track text-xs">Query History</p>
          {history.length === 0 ? (
            <p className="text-xs text-text-muted">No queries yet.</p>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => { setInput(entry.query); setResult(entry.result); setError(null); }}
                className={cn(
                  'w-full rounded border border-border bg-surface p-2.5 text-left',
                  'hover:bg-cream-200 transition-colors',
                )}
              >
                <p className="line-clamp-2 text-xs font-medium text-text-secondary">{entry.query}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {entry.result.rowCount} rows · {new Date(entry.executedAt).toLocaleTimeString('en-IN')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
