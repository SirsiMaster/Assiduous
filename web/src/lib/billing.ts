import { auth } from './firebase';

interface CheckoutSessionResponse {
  url: string;
}

/**
 * Create a Stripe Checkout Session for a subscription plan and redirect the browser.
 * Relies on the Go API at /api/billing/checkout-session and Firebase ID tokens
 * for authentication.
 */
export async function startSubscriptionCheckout(apiBaseURL: string, planPriceId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated before starting a subscription');
  }

  const idToken = await user.getIdToken();

  const successUrl = window.location.origin + '/billing/success';
  const cancelUrl = window.location.origin + '/billing/cancel';

  const res = await fetch(`${apiBaseURL}/api/billing/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      planPriceId,
      successUrl,
      cancelUrl,
    }),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { code?: string; message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(`Failed to create checkout session: ${message}`);
  }

  const data = (await res.json()) as CheckoutSessionResponse;
  if (!data.url) {
    throw new Error('Checkout session did not return a URL');
  }

  window.location.href = data.url;
}
