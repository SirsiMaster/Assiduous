import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

interface PlaidAccount {
  itemId: string;
  accountId: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
}

const PlaidAccountsList: React.FC<Props> = ({ apiBaseURL }) => {
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to view linked accounts');
        return;
      }

      const idToken = await user.getIdToken();
      const res = await fetch(`${apiBaseURL}/api/plaid/accounts`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === 'subscription_required') {
          throw new Error('Active subscription required to view linked accounts');
        }
        throw new Error(body.message || res.statusText || 'Failed to load accounts');
      }

      const list = (body.accounts || []) as PlaidAccount[];
      setAccounts(list);
    } catch (e: any) {
      console.error('[PlaidAccountsList] failed to load accounts', e);
      setError(e?.message || 'Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!apiBaseURL) return;
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseURL]);

  return (
    <div className="mt-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Linked bank accounts</h3>
        <button
          type="button"
          onClick={loadAccounts}
          disabled={isLoading || !apiBaseURL}
          className="px-2 py-0.5 rounded-md border border-slate-600 text-[11px] text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {accounts.length === 0 && !error && (
        <p className="text-[11px] text-slate-400">No linked accounts yet.</p>
      )}
      {accounts.length > 0 && (
        <div className="rounded-md border border-slate-700 bg-slate-900/60 p-2 max-h-40 overflow-auto">
          <ul className="space-y-1">
            {accounts.map((acc) => (
              <li key={acc.accountId} className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-semibold text-slate-100">{acc.name || 'Account'}</span>
                  <span className="ml-1 text-slate-400">••••{acc.mask}</span>
                  <span className="ml-1 text-slate-500 text-[10px]">
                    ({acc.type}
                    {acc.subtype ? ` · ${acc.subtype}` : ''})
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                  {acc.itemId}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaidAccountsList;
