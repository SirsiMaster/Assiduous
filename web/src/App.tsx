import React from 'react';

import DocumentUploader from './components/DocumentUploader';
import PricingPlans from './components/PricingPlans';
import PlaidLinkButton from './components/PlaidLinkButton';
import PlaidAccountsList from './components/PlaidAccountsList';
import LobLetterSender from './components/LobLetterSender';
import LobLettersList from './components/LobLettersList';
import OpenSignSender from './components/OpenSignSender';
import AiExplain from './components/AiExplain';
import MicroFlipAnalyzer from './components/MicroFlipAnalyzer';
import { useEntitlements } from './hooks/useEntitlements';

const App: React.FC = () => {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const { user, entitlements, role } = useEntitlements();

  return (
    <div className="min-h-screen bg-navy-900 text-slate-50 flex items-center justify-center p-6">
      <div className="px-6 py-4 rounded-xl border border-slate-800 bg-slate-900/70 shadow-xl max-w-3xl w-full space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Assiduous Web Shell</h1>
          <p className="text-sm text-slate-300">
            Encrypted uploads, Stripe subscriptions, and subscription entitlements are wired
            end-to-end via the Go API and Firestore.
          </p>

        {user && entitlements && (
          <p className="text-xs text-slate-400">
            Signed in as <span className="font-medium">{user.email || user.uid}</span>
            {role && (
              <>
                {' '}
                · Role: <span className="font-mono">{role}</span>
              </>
            )}
            {' '}
            · Plan:{' '}
            <span className="font-mono">
              {entitlements.planId || 'none'} ({entitlements.status || 'no-subscription'})
            </span>
          </p>
        )}
        </header>

        {!apiBaseURL && (
          <p className="text-xs text-amber-300">
            VITE_API_BASE_URL is not set. Configure it to point at the Cloud Run API before using
            encrypted uploads or subscriptions.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">Encrypted Uploads & Integrations</h2>
            {apiBaseURL && (
              <DocumentUploader
                apiBaseURL={apiBaseURL}
                collection="documents"
                storagePrefix="uploads/documents"
              />
            )}
            {apiBaseURL && (
              <>
                <PlaidLinkButton apiBaseURL={apiBaseURL} />
                {entitlements?.hasActiveSubscription && (
                  <PlaidAccountsList apiBaseURL={apiBaseURL} />
                )}
              </>
            )}
            {apiBaseURL &&
              entitlements?.hasActiveSubscription &&
              (role === 'admin' || role === 'agent') && (
                <>
                  <LobLetterSender apiBaseURL={apiBaseURL} />
                  <LobLettersList apiBaseURL={apiBaseURL} />
                  <OpenSignSender apiBaseURL={apiBaseURL} />
                </>
              )}
          </section>

          <section className="space-y-3">
            <PricingPlans apiBaseURL={apiBaseURL || ''} />
            {apiBaseURL && entitlements?.hasActiveSubscription && (
              <>
                <AiExplain apiBaseURL={apiBaseURL} />
                <MicroFlipAnalyzer apiBaseURL={apiBaseURL} />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
