import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

interface EnvelopeSummary {
  envelopeId: string;
  docType: string;
  status: string;
  createdAt: string;
}

const OpenSignSender: React.FC<Props> = ({ apiBaseURL }) => {
  const [docType, setDocType] = useState('contract');
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [envelopes, setEnvelopes] = useState<EnvelopeSummary[]>([]);
  const [isLoadingEnvelopes, setIsLoadingEnvelopes] = useState(false);

  const loadEnvelopes = async () => {
    try {
      setIsLoadingEnvelopes(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();

      const res = await fetch(`${apiBaseURL}/api/opensign/envelopes`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || res.statusText || 'Failed to load envelopes');
      }
      const list = (body.envelopes || []) as any[];
      const mapped: EnvelopeSummary[] = list.map((e) => ({
        envelopeId: e.envelopeId,
        docType: e.docType,
        status: e.status,
        createdAt: e.createdAt,
      }));
      setEnvelopes(mapped);
    } catch (e: any) {
      console.error('[OpenSignSender] failed to load envelopes', e);
      // Don't hard-fail the UI; only report if no other error is present
      if (!error) {
        setError(e?.message || 'Failed to load envelopes');
      }
    } finally {
      setIsLoadingEnvelopes(false);
    }
  };

  useEffect(() => {
    if (!apiBaseURL) return;
    void loadEnvelopes();
  }, [apiBaseURL]);

  const handleSend = async () => {
    try {
      setError(null);
      setStatus(null);

      if (!docType) {
        setError('Document type is required');
        return;
      }
      if (!sellerEmail) {
        setError('Seller email is required');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to create a signing envelope');
        return;
      }

      const idToken = await user.getIdToken();

      const recipients = [
        {
          role: 'seller',
          name: sellerName,
          email: sellerEmail,
        },
      ];

      setIsSending(true);

      const res = await fetch(`${apiBaseURL}/api/opensign/envelopes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          docType,
          recipients,
          metadata: {
            createdFrom: 'assiduous-web-shell',
          },
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || res.statusText || 'Failed to create envelope');
      }

      const infoParts = [`Envelope ${body.envelopeId || '(unknown id)'} created`, `status=${body.status}`];
      if (body.signingUrl) {
        infoParts.push(`signingUrl=${body.signingUrl}`);
      }

      setStatus(infoParts.join(' · '));
      // Refresh envelope list after successful creation
      void loadEnvelopes();
    } catch (e: any) {
      console.error('[OpenSignSender] failed to create envelope', e);
      setError(e?.message || 'Failed to create signing envelope');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <h2 className="font-semibold text-slate-100">E-Sign Envelopes (OpenSign)</h2>
      <p className="text-xs text-slate-300">
        Initiate a signing session for key contracts via OpenSign. This is restricted to admin/agent
        roles with an active subscription.
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <input
          type="text"
          placeholder="Document type (e.g. contract, listing)"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="text"
          placeholder="Seller name (optional)"
          value={sellerName}
          onChange={(e) => setSellerName(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="email"
          placeholder="Seller email"
          value={sellerEmail}
          onChange={(e) => setSellerEmail(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isSending || !apiBaseURL}
          onClick={handleSend}
          className="px-3 py-1.5 rounded-md bg-indigo-400 text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? 'Creating envelope…' : 'Create Signing Envelope'}
        </button>
        <button
          type="button"
          disabled={isLoadingEnvelopes || !apiBaseURL}
          onClick={loadEnvelopes}
          className="px-2 py-1 rounded-md border border-slate-600 text-slate-200 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoadingEnvelopes ? 'Refreshing…' : 'Refresh Status'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {status && !error && <p className="text-xs text-emerald-400">{status}</p>}

      {envelopes.length > 0 && (
        <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-200">
          <div className="mb-1 font-semibold text-slate-100">Recent envelopes</div>
          <ul className="space-y-1 max-h-40 overflow-auto">
            {envelopes.map((env) => (
              <li key={env.envelopeId} className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-mono text-[10px] text-slate-400">{env.envelopeId}</span>
                  <span className="ml-1 text-slate-300">({env.docType})</span>
                </div>
                <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] capitalize">
                  {env.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OpenSignSender;
