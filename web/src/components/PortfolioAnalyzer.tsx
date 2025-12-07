import React, { useState } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  apiBaseURL: string;
}

interface DealAnalysis {
  inputs: {
    purchasePrice: number;
    afterRepairValue: number;
    rehabCosts: number;
    holdingPeriod: number;
  };
  metrics: {
    netProfit: number;
    roi: number;
    cashOnCashReturn: number;
    annualizedROI: number;
    totalInvestment: number;
    cashInvested: number;
  };
  assessment: {
    viability: string;
    dealQuality: string;
    riskLevel: string;
  };
}

interface PortfolioMetrics {
  totalInvestment: number;
  netProfit: number;
  roi: number;
  cashOnCashReturn: number;
  annualizedROI: number;
  totalCashInvested: number;
  totalAfterRepairValue: number;
}

interface PortfolioAnalysis {
  deals: DealAnalysis[];
  metrics: PortfolioMetrics;
}

interface PortfolioDealInput {
  id: string;
  label: string;
  purchasePrice: number;
  arv: number;
  rehab: number;
  holdingMonths: number;
  closingPct: number;
  sellPct: number;
  downPct: number;
  interestRate: number;
  holdingMonthly: number;
  taxRatePct: number;
  insuranceRatePct: number;
  hoaMonthly: number;
  exitCostPct: number;
}

const currency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v || 0);

const percent = (v: number) => `${(v || 0).toFixed(1)}%`;

const defaultDeal = (index: number): PortfolioDealInput => ({
  id: `deal-${index + 1}`,
  label: `Deal ${index + 1}`,
  purchasePrice: 250000,
  arv: 350000,
  rehab: 50000,
  holdingMonths: 4,
  closingPct: 3,
  sellPct: 8,
  downPct: 20,
  interestRate: 7,
  holdingMonthly: 1500,
  taxRatePct: 1.2,
  insuranceRatePct: 0.5,
  hoaMonthly: 0,
  exitCostPct: 8,
});

const PortfolioAnalyzer: React.FC<Props> = ({ apiBaseURL }) => {
  const [deals, setDeals] = useState<PortfolioDealInput[]>([defaultDeal(0), defaultDeal(1)]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateDeal = (id: string, patch: Partial<PortfolioDealInput>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleAddDeal = () => {
    setDeals((prev) => [...prev, defaultDeal(prev.length)]);
  };

  const handleRemoveDeal = (id: string) => {
    setDeals((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.id !== id)));
  };

  const handleAnalyzePortfolio = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to analyze a portfolio');
        return;
      }
      if (!deals.length) {
        setError('Add at least one deal to analyze');
        return;
      }

      const idToken = await user.getIdToken();

      const payloadDeals = deals.map((d) => {
        const holdingDays = Math.max(30, d.holdingMonths * 30);
        const closingCosts = (d.purchasePrice * d.closingPct) / 100;
        const sellingCosts = (d.arv * d.sellPct) / 100;
        const downPayment = (d.purchasePrice * d.downPct) / 100;
        const loanAmount = Math.max(0, d.purchasePrice - downPayment);

        return {
          purchasePrice: d.purchasePrice,
          afterRepairValue: d.arv,
          rehabCosts: d.rehab,
          holdingPeriod: holdingDays,
          closingCosts,
          sellingCosts,
          financingType: d.downPct < 100 ? 'financed' : 'cash',
          downPayment,
          loanAmount,
          interestRate: d.interestRate,
          utilities: d.holdingMonthly,
          taxRatePercent: d.taxRatePct,
          insuranceRatePercent: d.insuranceRatePct,
          hoaMonthly: d.hoaMonthly,
          exitCostPercentOverride: d.exitCostPct,
        };
      });

      const res = await fetch(`${apiBaseURL}/api/microflip/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ deals: payloadDeals }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        if (data.code === 'subscription_required') {
          throw new Error('Active subscription required for portfolio analysis');
        }
        throw new Error(data.message || res.statusText || 'Failed to analyze portfolio');
      }

      setAnalysis(data as PortfolioAnalysis);
    } catch (e: any) {
      console.error('[PortfolioAnalyzer] analyze failed', e);
      setError(e?.message || 'Failed to analyze portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-xs mt-4 border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Portfolio / Multi-Asset Analyzer</h2>
          <p className="text-[11px] text-slate-400">
            Combine multiple micro-flip scenarios (units, parcels, or properties) and see
            aggregated ROI and cash-on-cash across the entire portfolio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddDeal}
          className="px-2 py-1 rounded-md border border-slate-700 text-[11px] text-slate-100 hover:bg-slate-800"
        >
          + Add deal
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {deals.map((d, idx) => (
          <div
            key={d.id}
            className="rounded-md border border-slate-800 bg-slate-900/70 p-2 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={d.label}
                  onChange={(e) => updateDeal(d.id, { label: e.target.value })}
                  className="w-32 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
                <span className="text-[10px] text-slate-500">#{idx + 1}</span>
              </div>
              {deals.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDeal(d.id)}
                  className="text-[10px] text-slate-400 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Price</label>
                <input
                  type="number"
                  value={d.purchasePrice}
                  onChange={(e) => updateDeal(d.id, { purchasePrice: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">ARV</label>
                <input
                  type="number"
                  value={d.arv}
                  onChange={(e) => updateDeal(d.id, { arv: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Rehab</label>
                <input
                  type="number"
                  value={d.rehab}
                  onChange={(e) => updateDeal(d.id, { rehab: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Hold (mo)</label>
                <input
                  type="number"
                  value={d.holdingMonths}
                  onChange={(e) => updateDeal(d.id, { holdingMonths: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Closing %</label>
                <input
                  type="number"
                  value={d.closingPct}
                  onChange={(e) => updateDeal(d.id, { closingPct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Sell %</label>
                <input
                  type="number"
                  value={d.sellPct}
                  onChange={(e) => updateDeal(d.id, { sellPct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Down %</label>
                <input
                  type="number"
                  value={d.downPct}
                  onChange={(e) => updateDeal(d.id, { downPct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Rate %</label>
                <input
                  type="number"
                  value={d.interestRate}
                  onChange={(e) => updateDeal(d.id, { interestRate: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Hold $/mo</label>
                <input
                  type="number"
                  value={d.holdingMonthly}
                  onChange={(e) => updateDeal(d.id, { holdingMonthly: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Tax %</label>
                <input
                  type="number"
                  value={d.taxRatePct}
                  onChange={(e) => updateDeal(d.id, { taxRatePct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Ins %</label>
                <input
                  type="number"
                  value={d.insuranceRatePct}
                  onChange={(e) => updateDeal(d.id, { insuranceRatePct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">HOA $/mo</label>
                <input
                  type="number"
                  value={d.hoaMonthly}
                  onChange={(e) => updateDeal(d.id, { hoaMonthly: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-[11px] text-slate-200">Exit %</label>
                <input
                  type="number"
                  value={d.exitCostPct}
                  onChange={(e) => updateDeal(d.id, { exitCostPct: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={isLoading || !apiBaseURL}
          onClick={handleAnalyzePortfolio}
          className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-900 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing portfolio…' : 'Analyze portfolio'}
        </button>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      {analysis && !error && (
        <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Portfolio summary
              </div>
              <div className="text-sm font-semibold">
                ROI {percent(analysis.metrics.roi)} · Net profit {currency(analysis.metrics.netProfit)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {deals.length} deals · Total investment {currency(analysis.metrics.totalInvestment)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-200">
            <div>
              <div className="text-slate-400 text-[10px]">Cash-on-cash</div>
              <div className="font-mono">{percent(analysis.metrics.cashOnCashReturn)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Annualized ROI</div>
              <div className="font-mono">{percent(analysis.metrics.annualizedROI)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Total ARV</div>
              <div className="font-mono">{currency(analysis.metrics.totalAfterRepairValue)}</div>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-800 pt-2">
            <div className="mb-1 text-[11px] font-semibold text-slate-300">Per-deal breakdown</div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {analysis.deals.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/70 px-2 py-1"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-100">
                      {deals[idx]?.label || `Deal ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currency(d.inputs.purchasePrice)} → {currency(d.inputs.afterRepairValue)} · ROI{' '}
                      {percent(d.metrics.roi)}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-slate-300 font-mono">
                    <div>Profit {currency(d.metrics.netProfit)}</div>
                    <div>Cash {percent(d.metrics.cashOnCashReturn)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioAnalyzer;
