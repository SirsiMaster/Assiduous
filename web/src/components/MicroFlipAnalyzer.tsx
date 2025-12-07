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
  costs: {
    acquisition: number;
    rehab: number;
    holding: number;
    exit: number;
    total: number;
  };
  metrics: {
    grossProfit: number;
    netProfit: number;
    roi: number;
    cashOnCashReturn: number;
    annualizedROI: number;
    totalInvestment: number;
    cashInvested: number;
    profitMargin: number;
  };
  assessment: {
    viability: string;
    seventyPercentRuleMet: boolean;
    maxAllowableOffer: number;
    dealQuality: string;
    riskLevel: string;
  };
  recommendations: {
    type: string;
    category: string;
    message: string;
    action: string;
  }[];
  analyzedAt: string;
}

const currency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v || 0);

const percent = (v: number) => `${(v || 0).toFixed(1)}%`;

const MicroFlipAnalyzer: React.FC<Props> = ({ apiBaseURL }) => {
  const [purchasePrice, setPurchasePrice] = useState(250000);
  const [arv, setArv] = useState(350000);
  const [rehab, setRehab] = useState(50000);
  const [holdingMonths, setHoldingMonths] = useState(4);
  const [closingCostsPct, setClosingCostsPct] = useState(3);
  const [sellingCostsPct, setSellingCostsPct] = useState(8);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(7);
  const [holdingMonthly, setHoldingMonthly] = useState(1500);

  // Advanced assumptions
  const [taxRatePct, setTaxRatePct] = useState(1.2); // default 1.2% annual
  const [insuranceRatePct, setInsuranceRatePct] = useState(0.5); // default 0.5% annual
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [exitCostPct, setExitCostPct] = useState(8); // default 8% of ARV
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to analyze deals');
        return;
      }

      const idToken = await user.getIdToken();

      const holdingDays = Math.max(30, holdingMonths * 30);
      const closingCosts = (purchasePrice * closingCostsPct) / 100;
      const sellingCosts = (arv * sellingCostsPct) / 100;
      const downPayment = (purchasePrice * downPaymentPct) / 100;
      const loanAmount = Math.max(0, purchasePrice - downPayment);

      const body = {
        purchasePrice,
        afterRepairValue: arv,
        rehabCosts: rehab,
        holdingPeriod: holdingDays,
        closingCosts,
        sellingCosts,
        financingType: downPaymentPct < 100 ? 'financed' : 'cash',
        downPayment,
        loanAmount,
        interestRate,
        utilities: holdingMonthly,
        taxRatePercent: taxRatePct,
        insuranceRatePercent: insuranceRatePct,
        hoaMonthly,
        exitCostPercentOverride: exitCostPct,
      };

      const res = await fetch(`${apiBaseURL}/api/microflip/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        if (data.code === 'subscription_required') {
          throw new Error('Active subscription required for micro-flip analysis');
        }
        throw new Error(data.message || res.statusText || 'Failed to analyze deal');
      }

      setAnalysis(data as DealAnalysis);
    } catch (e: any) {
      console.error('[MicroFlipAnalyzer] analyze failed', e);
      setError(e?.message || 'Failed to analyze deal');
    } finally {
      setIsLoading(false);
    }
  };

  const viabClass = (v: string) => {
    if (v === 'excellent') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (v === 'good') return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    if (v === 'marginal') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-sm font-semibold text-slate-100">Micro-Flip Deal Analyzer</h2>
      <p className="text-xs text-slate-300">
        Run full-stack underwriting on a potential micro-flip: profit, ROI, 70% rule, and risk
        assessment – backed by the Go micro-flip engine.
      </p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-2">
          <div>
            <label className="block mb-1 text-slate-200">Purchase price</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-200">After repair value (ARV)</label>
            <input
              type="number"
              value={arv}
              onChange={(e) => setArv(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-200">Rehab / repairs</label>
            <input
              type="number"
              value={rehab}
              onChange={(e) => setRehab(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-slate-200">Holding (months)</label>
              <input
                type="number"
                value={holdingMonths}
                onChange={(e) => setHoldingMonths(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-200">Holding costs / mo</label>
              <input
                type="number"
                value={holdingMonthly}
                onChange={(e) => setHoldingMonthly(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-slate-200">Closing costs (%)</label>
              <input
                type="number"
                value={closingCostsPct}
                onChange={(e) => setClosingCostsPct(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-200">Sell costs (%)</label>
              <input
                type="number"
                value={sellingCostsPct}
                onChange={(e) => setSellingCostsPct(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
          </div>
          <button
            type="button"
            className="mt-1 text-[10px] text-slate-400 underline"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? 'Hide advanced assumptions' : 'Show advanced assumptions'}
          </button>
          {showAdvanced && (
            <div className="mt-2 space-y-2 rounded-md border border-slate-700 bg-slate-900/80 p-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-slate-200 text-[11px]">Property tax rate (annual %)</label>
                  <input
                    type="number"
                    value={taxRatePct}
                    onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-200 text-[11px]">Insurance rate (annual %)</label>
                  <input
                    type="number"
                    value={insuranceRatePct}
                    onChange={(e) => setInsuranceRatePct(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 text-[11px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-slate-200 text-[11px]">HOA / condo fees (per month)</label>
                  <input
                    type="number"
                    value={hoaMonthly}
                    onChange={(e) => setHoaMonthly(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-200 text-[11px]">Exit costs override (% of ARV)</label>
                  <input
                    type="number"
                    value={exitCostPct}
                    onChange={(e) => setExitCostPct(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 text-[11px]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                If left blank, the engine uses opinionated defaults (1.2% tax, 0.5% insurance, and
                8% exit costs). These settings apply only to this analysis.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-slate-200">Down payment (%)</label>
              <input
                type="number"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-200">Interest rate (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading || !apiBaseURL}
            onClick={handleAnalyze}
            className="mt-2 w-full px-3 py-1.5 rounded-md bg-emerald-400 text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing…' : 'Analyze Deal'}
          </button>
          {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
        </div>
      </div>

      {analysis && !error && (
        <div className="mt-2 space-y-3 rounded-md border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Deal summary
              </div>
              <div className="text-sm font-semibold">
                ROI {percent(analysis.metrics.roi)} · Net profit {currency(analysis.metrics.netProfit)}
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded-full border text-[11px] font-semibold ${viabClass(
                analysis.assessment.viability,
              )}`}
            >
              {analysis.assessment.viability.toUpperCase()} · {analysis.assessment.dealQuality}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">Investment</div>
              <div className="flex justify-between">
                <span>Total investment</span>
                <span className="font-mono">{currency(analysis.metrics.totalInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash invested</span>
                <span className="font-mono">{currency(analysis.metrics.cashInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span>70% rule MAO</span>
                <span className="font-mono">{currency(analysis.assessment.maxAllowableOffer)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">Performance</div>
              <div className="flex justify-between">
                <span>Cash-on-cash</span>
                <span className="font-mono">{percent(analysis.metrics.cashOnCashReturn)}</span>
              </div>
              <div className="flex justify-between">
                <span>Annualized ROI</span>
                <span className="font-mono">{percent(analysis.metrics.annualizedROI)}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk level</span>
                <span className="font-mono capitalize">{analysis.assessment.riskLevel}</span>
              </div>
            </div>
          </div>

          {analysis.recommendations?.length > 0 && (
            <div className="border-t border-slate-700 pt-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Recommendations
              </div>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={`${rec.category}-${idx}`} className="flex gap-2">
                    <span className="mt-[2px] text-[10px]">
                      {rec.type === 'success' ? '✅' : rec.type === 'danger' ? '❌' : '•'}
                    </span>
                    <span>
                      <span className="font-semibold capitalize">{rec.category}: </span>
                      {rec.message}{' '}
                      <span className="text-slate-400">{rec.action}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MicroFlipAnalyzer;
