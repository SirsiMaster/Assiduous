// MicroFlip API Client
// Shared helper for HTML pages to call the canonical Go micro-flip engine.
//
// IMPORTANT ARCHITECTURE NOTE
// ---------------------------
// All underwriting (ROI, profit, cost breakdowns, portfolio metrics) MUST flow
// through the Go microflip.Engine via the /api/microflip HTTP endpoints.
// This file is the single front-end adapter for those endpoints.
//
// Do NOT implement alternative client-side engines for financial calculations.
// Any new calculators or analyzers should call MicroFlipApiClient.* so the
// Go implementation remains the sole source of truth.

(function (global) {
  'use strict';

  /**
   * Normalize UI fields into DealInput payload expected by /api/microflip/analyze
   *
   * @param {Object} params
   * @returns {Object} DealInput-compatible body
   */
  function buildDealInput(params) {
    var purchasePrice = Number(params.purchasePrice) || 0;
    var afterRepairValue = Number(params.afterRepairValue) || 0;
    var rehabCosts = Number(params.rehabCosts) || 0;
    var holdingMonths = Number(params.holdingMonths) || 0;
    var closingPercent = Number(params.closingPercent) || 0;
    var agentCommissionPercent = Number(params.agentCommissionPercent) || 0;
    var downPaymentPercent = Number(params.downPaymentPercent) || 0;
    var interestRate = Number(params.interestRate) || 0;
    var utilitiesMonthly = Number(params.utilitiesMonthly) || 0;

    var taxRatePercent = Number(params.taxRatePercent) || 0;
    var insuranceRatePercent = Number(params.insuranceRatePercent) || 0;
    var hoaMonthly = Number(params.hoaMonthly) || 0;
    var exitCostPercentOverride = Number(params.exitCostPercentOverride) || 0;

    // Minimum 1 month
    if (!holdingMonths || holdingMonths < 1) {
      holdingMonths = 3; // default 3 months
    }
    var holdingPeriodDays = holdingMonths * 30;

    // Closing on purchase
    var closingCosts = closingPercent > 0
      ? (purchasePrice * closingPercent) / 100
      : 0;

    // Selling costs at exit (commission + seller closing)
    var sellingCostsPercent = closingPercent + agentCommissionPercent;
    var sellingCosts = sellingCostsPercent > 0
      ? (afterRepairValue * sellingCostsPercent) / 100
      : 0;

    var downPayment = downPaymentPercent > 0
      ? (purchasePrice * downPaymentPercent) / 100
      : 0;
    var loanAmount = Math.max(0, purchasePrice - downPayment);

    return {
      purchasePrice: purchasePrice,
      afterRepairValue: afterRepairValue,
      rehabCosts: rehabCosts,
      holdingPeriod: holdingPeriodDays,
      closingCosts: closingCosts,
      sellingCosts: sellingCosts,
      financingType: downPaymentPercent < 100 ? 'financed' : 'cash',
      downPayment: downPayment,
      loanAmount: loanAmount,
      interestRate: interestRate,
      // Let engine compute PropertyTaxes/Insurance from these rate hints when set.
      taxRatePercent: taxRatePercent,
      insuranceRatePercent: insuranceRatePercent,
      utilities: utilitiesMonthly,
      hoaMonthly: hoaMonthly,
      exitCostPercentOverride: exitCostPercentOverride,
    };
  }

  /**
   * Call /api/microflip/analyze via Firebase.APIService
   *
   * @param {Object} params - UI params to be converted into DealInput
   * @returns {Promise<Object>} DealAnalysis JSON
   */
  async function analyzeDeal(params) {
    if (!global.Firebase || !global.Firebase.APIService) {
      throw new Error('Firebase APIService not available');
    }
    var body = buildDealInput(params || {});
    var result = await global.Firebase.APIService.callAPI('/microflip/analyze', 'POST', body);
    if (!result || !result.success) {
      throw new Error(result && result.error ? result.error : 'Micro-flip analysis failed');
    }
    return result.data;
  }

  /**
   * Call /api/microflip/portfolio for multi-asset analysis.
   *
   * @param {Array<Object>} dealsParams - array of UI-level params to be converted into DealInput
   * @returns {Promise<Object>} PortfolioAnalysis JSON
   */
  async function analyzePortfolio(dealsParams) {
    if (!global.Firebase || !global.Firebase.APIService) {
      throw new Error('Firebase APIService not available');
    }
    var deals = Array.isArray(dealsParams) ? dealsParams : [];
    if (!deals.length) {
      throw new Error('At least one deal is required');
    }
    var body = {
      deals: deals.map(function (p) { return buildDealInput(p || {}); }),
    };
    var result = await global.Firebase.APIService.callAPI('/microflip/portfolio', 'POST', body);
    if (!result || !result.success) {
      throw new Error(result && result.error ? result.error : 'Portfolio analysis failed');
    }
    return result.data;
  }

  /**
   * Derive some presentation-friendly slices from DealAnalysis
   *
   * @param {Object} analysis - DealAnalysis from backend
   */
  function mapAnalysisForCalculator(analysis) {
    analysis = analysis || {};
    var inputs = analysis.inputs || {};
    var costs = analysis.costs || {};
    var metrics = analysis.metrics || {};
    var assessment = analysis.assessment || {};

    var purchasePrice = inputs.purchasePrice || 0;
    var arv = inputs.afterRepairValue || 0;
    var rehab = inputs.rehabCosts || 0;

    // Derive closing costs on acquisition as acquisition minus price
    var acquisitionClosing = 0;
    if (costs.acquisition != null && purchasePrice != null) {
      acquisitionClosing = Math.max(0, (costs.acquisition || 0) - purchasePrice);
    }

    return {
      purchasePrice: purchasePrice,
      arv: arv,
      rehab: rehab,
      closingCosts: acquisitionClosing,
      holdingCosts: costs.holding || 0,
      exitCosts: costs.exit || 0,
      totalInvestment: metrics.totalInvestment || 0,
      netProfit: metrics.netProfit != null ? metrics.netProfit : metrics.grossProfit || 0,
      roi: metrics.roi || 0,
      cashOnCash: metrics.cashOnCashReturn || 0,
      annualizedROI: metrics.annualizedROI || 0,
      assessment: assessment,
      raw: analysis,
    };
  }

  global.MicroFlipApiClient = {
    analyzeDeal: analyzeDeal,
    analyzePortfolio: analyzePortfolio,
    mapAnalysisForCalculator: mapAnalysisForCalculator,
  };
})(window);
