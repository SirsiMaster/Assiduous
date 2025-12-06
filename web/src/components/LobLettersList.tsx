import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

interface LetterSummary {
  lobLetterId: string;
  templateId: string;
  status: string;
  createdAt: string;
}

const LobLettersList: React.FC<Props> = ({ apiBaseURL }) => {
  const [letters, setLetters] = useState<LetterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLetters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to view certified mail history');
        return;
      }

      const idToken = await user.getIdToken();
      const res = await fetch(`${apiBaseURL}/api/lob/letters`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === 'subscription_required') {
          throw new Error('Active subscription required to view certified mail history');
        }
        throw new Error(body.message || res.statusText || 'Failed to load letters');
      }

      const list = (body.letters || []) as LetterSummary[];
      setLetters(list);
    } catch (e: any) {
      console.error('[LobLettersList] failed to load letters', e);
      setError(e?.message || 'Failed to load certified mail history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!apiBaseURL) return;
    void loadLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseURL]);

  return (
    <div className="mt-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Recent certified letters</h3>
        <button
          type="button"
          onClick={loadLetters}
          disabled={isLoading || !apiBaseURL}
          className="px-2 py-0.5 rounded-md border border-slate-600 text-[11px] text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {letters.length === 0 && !error && (
        <p className="text-[11px] text-slate-400">No letters sent yet.</p>
      )}

      {letters.length > 0 && (
        <div className="rounded-md border border-slate-700 bg-slate-900/60 p-2 max-h-40 overflow-auto">
          <ul className="space-y-1">
            {letters.map((l) => (
              <li key={l.lobLetterId} className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-mono text-[10px] text-slate-400">{l.lobLetterId}</span>
                  <span className="ml-1 text-slate-300">({l.templateId})</span>
                </div>
                <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] capitalize">
                  {l.status || 'queued'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LobLettersList;
