import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

const PlaidLinkButton: React.FC<Props> = ({ apiBaseURL }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLinkToken = async () => {
      try {
        setError(null);
        const user = auth.currentUser;
        if (!user) {
          setError('You must be signed in to link a bank account');
          return;
        }

        const idToken = await user.getIdToken();
        const res = await fetch(`${apiBaseURL}/api/plaid/link-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ userName: user.displayName || user.email || user.uid }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.code === 'subscription_required') {
            throw new Error('Active subscription required to link bank accounts');
          }
          throw new Error(body.message || res.statusText);
        }

        const data = (await res.json()) as { linkToken: string };
        if (isMounted) {
          setLinkToken(data.linkToken);
        }
      } catch (e: any) {
        console.error('[PlaidLinkButton] failed to fetch link token', e);
        if (isMounted) setError(e?.message || 'Failed to initialize Plaid Link');
      }
    };

    fetchLinkToken();

    return () => {
      isMounted = false;
    };
  }, [apiBaseURL]);

  const onSuccess = async (publicToken: string, metadata: any) => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to link a bank account');
        return;
      }

      const idToken = await user.getIdToken();

      const res = await fetch(`${apiBaseURL}/api/plaid/token-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          publicToken,
          institutionName: metadata.institution?.name || '',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || res.statusText);
      }
    } catch (e: any) {
      console.error('[PlaidLinkButton] token exchange failed', e);
      setError(e?.message || 'Failed to link bank account');
    }
  };

  const config = {
    token: linkToken || '',
    onSuccess,
  } as const;

  const { open, ready } = usePlaidLink(config);

  const disabled = !ready || !linkToken;

  return (
    <div className="space-y-2 text-sm">
      <h2 className="font-semibold text-slate-100">Link bank account (Plaid)</h2>
      <p className="text-xs text-slate-300">
        Securely connect your bank account via Plaid. Tokens are exchanged and stored encrypted
        with Google Cloud KMS.
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => open()}
        className="px-3 py-1.5 rounded-md bg-emerald-400 text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {disabled ? 'Initializing…' : 'Link Bank via Plaid'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default PlaidLinkButton;
