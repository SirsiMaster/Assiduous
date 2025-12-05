import React, { useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

const LobLetterSender: React.FC<Props> = ({ apiBaseURL }) => {
  const [toName, setToName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    try {
      setError(null);
      setStatus(null);

      if (!templateId) {
        setError('Template ID is required');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to send certified mail');
        return;
      }

      const idToken = await user.getIdToken();

      const toAddress = {
        name: toName,
        address_line1: addressLine1,
        address_city: city,
        address_state: state,
        address_zip: zip,
      };

      setIsSending(true);

      const res = await fetch(`${apiBaseURL}/api/lob/letters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          toAddress,
          templateId,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || res.statusText || 'Failed to send letter');
      }

      setStatus(`Letter created with ID ${body.letterId || '(unknown id)'}`);
    } catch (e: any) {
      console.error('[LobLetterSender] failed to send letter', e);
      setError(e?.message || 'Failed to send certified letter');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <h2 className="font-semibold text-slate-100">Certified Mail (Lob)</h2>
      <p className="text-xs text-slate-300">
        Send a certified letter via Lob using a predefined template. This is an admin/agent-only
        operational tool.
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <input
          type="text"
          placeholder="Recipient name"
          value={toName}
          onChange={(e) => setToName(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="text"
          placeholder="Address line 1"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="ZIP"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <input
          type="text"
          placeholder="Template ID (e.g. tmpl_...)"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 placeholder:text-slate-500 font-mono"
        />
      </div>

      <button
        type="button"
        disabled={isSending || !apiBaseURL}
        onClick={handleSend}
        className="px-3 py-1.5 rounded-md bg-sky-400 text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSending ? 'Sending…' : 'Send Certified Letter'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {status && !error && <p className="text-xs text-emerald-400">{status}</p>}
    </div>
  );
};

export default LobLetterSender;