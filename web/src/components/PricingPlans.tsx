import React, { useState } from 'react';
import { startSubscriptionCheckout } from '../lib/billing';

interface Plan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  priceLabel: string;
}

interface Props {
  apiBaseURL: string;
}

const PricingPlans: React.FC<Props> = ({ apiBaseURL }) => {
  const proPriceId = import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined;
  const starterPriceId = import.meta.env.VITE_STRIPE_PRICE_STARTER as string | undefined;

  const plans: Plan[] = [];

  if (starterPriceId) {
    plans.push({
      id: 'starter',
      name: 'Assiduous Starter',
      description: 'Entry plan for smaller investors and early adopters.',
      stripePriceId: starterPriceId,
      priceLabel: '$ /mo (Stripe configured)',
    });
  }

  if (proPriceId) {
    plans.push({
      id: 'pro',
      name: 'Assiduous Realty Pro',
      description: 'Full micro-flip engine, analytics, and AI tools.',
      stripePriceId: proPriceId,
      priceLabel: '$ /mo (Stripe configured)',
    });
  }

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    setError(null);
    setIsProcessing(plan.id);
    try {
      await startSubscriptionCheckout(apiBaseURL, plan.stripePriceId);
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout');
      setIsProcessing(null);
    }
  };

  if (!plans.length) {
    return (
      <div className="space-y-2 text-xs text-amber-300">
        <h2 className="font-semibold text-slate-100 text-sm">Subscriptions</h2>
        <p>
          Stripe price IDs are not configured. Set VITE_STRIPE_PRICE_PRO and/or
          VITE_STRIPE_PRICE_STARTER to enable subscription checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <h2 className="font-semibold text-slate-100">Subscribe to Assiduous Realty</h2>
      <p className="text-slate-300 text-xs">
        Choose a plan to start your subscription. You&apos;ll be redirected to a secure Stripe
        Checkout session. When payment completes, your subscription status will sync back to
        Assiduous via webhooks.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">{plan.name}</h3>
              <p className="text-xs text-slate-300">{plan.description}</p>
              <p className="text-xs text-brand-accent font-mono">{plan.priceLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => handleSubscribe(plan)}
              disabled={isProcessing === plan.id}
              className="mt-3 inline-flex items-center justify-center rounded-md bg-brand-accent text-slate-900 text-xs font-medium px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing === plan.id ? 'Redirecting…' : 'Subscribe via Stripe'}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default PricingPlans;
