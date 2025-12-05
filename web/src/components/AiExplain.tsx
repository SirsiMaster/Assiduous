import React, { useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

const AiExplain: React.FC<Props> = ({ apiBaseURL }) => {
  const [prompt, setPrompt] = useState('Explain how the Assiduous micro-flipping engine works in simple terms.');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to use AI explanations');
        return;
      }

      const idToken = await user.getIdToken();

      const res = await fetch(`${apiBaseURL}/api/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || res.statusText || 'Failed to get explanation');
      }

      setAnswer(body.answer || '(no answer returned)');
    } catch (e: any) {
      console.error('[AiExplain] failed to get explanation', e);
      setError(e?.message || 'Failed to get explanation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <h2 className="font-semibold text-slate-100">AI Explanation (Vertex/Gemini)</h2>
      <p className="text-xs text-slate-300">
        Ask the AI to explain a feature or concept. This calls the Go backend, which uses Vertex AI
        (Gemini) under the hood.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 resize-none"
      />

      <button
        type="button"
        disabled={isLoading || !apiBaseURL}
        onClick={handleExplain}
        className="px-3 py-1.5 rounded-md bg-emerald-400 text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Thinking…' : 'Ask Gemini'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {answer && !error && (
        <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-100 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
};

export default AiExplain;
