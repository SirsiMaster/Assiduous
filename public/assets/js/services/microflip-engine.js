/**
 * Assiduous Micro-Flipping Engine
 * Core business logic for property investment analysis
 * Target: $2-5K profit per deal
 * 
 * @version 1.0.0
 */

class MicroFlipEngine {
    constructor() {
        this.TARGET_MIN_PROFIT = 2000;
        this.TARGET_MAX_PROFIT = 5000;
        this.TARGET_MIN_ROI = 15; // 15% minimum ROI
        this.IDEAL_ROI = 25; // 25% ideal ROI
    }

    /**
     * Calculate comprehensive deal analysis
     * @param {Object} property - Property details
     * @returns {Object} Complete analysis with recommendations
     */
    analyzeDeal(property) {
        const {
            purchasePrice,
            afterRepairValue,
            rehabCosts,
            holdingPeriod = 90, // days
            closingCosts,
            sellingCosts,
            financingType = 'cash',
            downPayment = 0,
            loanAmount = 0,
            interestRate = 0,
            propertyTaxes = 0,
            insurance = 0,
            utilities = 0
        } = property;

        // 1. Calculate total acquisition costs
        const acquisitionCosts = this.calculateAcquisitionCosts(
            purchasePrice,
            closingCosts
        );

        // 2. Calculate rehab/improvement costs
        const totalRehabCosts = rehabCosts || 0;

        // 3. Calculate holding costs
        const holdingCosts = this.calculateHoldingCosts({
            purchasePrice,
            holdingPeriod,
            propertyTaxes,
            insurance,
            utilities,
            loanAmount,
            interestRate
        });

        // 4. Calculate exit costs
        const exitCosts = this.calculateExitCosts(
            afterRepairValue,
            sellingCosts
        );

        // 5. Calculate total investment
        const totalInvestment = acquisitionCosts + totalRehabCosts + holdingCosts;

        // 6. Calculate total costs (including exit)
        const totalCosts = totalInvestment + exitCosts;

        // 7. Calculate profit
        const grossProfit = afterRepairValue - totalCosts;
        const netProfit = grossProfit;

        // 8. Calculate ROI
        const roi = (netProfit / totalInvestment) * 100;

        // 9. Calculate cash-on-cash return (if financed)
        const cashInvested = financingType === 'financed' 
            ? downPayment + totalRehabCosts + holdingCosts
            : totalInvestment;
        const cashOnCashReturn = (netProfit / cashInvested) * 100;

        // 10. Calculate annualized ROI
        const annualizedROI = (roi / holdingPeriod) * 365;

        // 11. Determine deal viability
        const viability = this.assessViability({
            netProfit,
            roi,
            totalInvestment,
            holdingPeriod
        });

        // 12. Calculate 70% rule (common wholesaling formula)
        const maxAllowableOffer = (afterRepairValue * 0.70) - totalRehabCosts;
        const seventyPercentRuleMet = purchasePrice <= maxAllowableOffer;

        // 13. Generate recommendations
        const recommendations = this.generateRecommendations({
            netProfit,
            roi,
            viability,
            seventyPercentRuleMet,
            purchasePrice,
            maxAllowableOffer,
            holdingPeriod
        });

        return {
            // Input summary
            inputs: {
                purchasePrice,
                afterRepairValue,
                rehabCosts: totalRehabCosts,
                holdingPeriod
            },
            
            // Cost breakdown
            costs: {
                acquisition: acquisitionCosts,
                rehab: totalRehabCosts,
                holding: holdingCosts,
                exit: exitCosts,
                total: totalCosts
            },
            
            // Financial metrics
            metrics: {
                grossProfit,
                netProfit,
                roi,
                cashOnCashReturn,
                annualizedROI,
                totalInvestment,
                cashInvested,
                profitMargin: (netProfit / afterRepairValue) * 100
            },
            
            // Deal assessment
            assessment: {
                viability,
                seventyPercentRuleMet,
                maxAllowableOffer,
                dealQuality: this.rateDealQuality(roi, netProfit),
                riskLevel: this.assessRisk(property, viability)
            },
            
            // Actionable insights
            recommendations,
            
            // Timestamps
            analyzedAt: new Date().toISOString()
        };
    }

    /**
     * Calculate acquisition costs
     */
    calculateAcquisitionCosts(purchasePrice, closingCosts = 0) {
        // Default closing costs: 2-3% if not provided
        const defaultClosingCosts = closingCosts || (purchasePrice * 0.025);
        return purchasePrice + defaultClosingCosts;
    }

    /**
     * Calculate holding costs
     */
    calculateHoldingCosts(params) {
        const {
            purchasePrice,
            holdingPeriod,
            propertyTaxes = 0,
            insurance = 0,
            utilities = 0,
            loanAmount = 0,
            interestRate = 0
        } = params;

        const months = holdingPeriod / 30;

        // Property taxes (annual rate / 12 * months)
        const taxCosts = propertyTaxes 
            ? (propertyTaxes / 12) * months 
            : (purchasePrice * 0.012 / 12) * months; // Default 1.2% annual

        // Insurance
        const insuranceCosts = insurance 
            ? (insurance / 12) * months 
            : (purchasePrice * 0.005 / 12) * months; // Default 0.5% annual

        // Utilities
        const utilityCosts = utilities * months;

        // Loan interest (if financed)
        const interestCosts = loanAmount && interestRate
            ? (loanAmount * (interestRate / 100) / 12) * months
            : 0;

        // HOA fees (estimated if applicable)
        const hoaFees = 0; // Can be added as parameter

        return taxCosts + insuranceCosts + utilityCosts + interestCosts + hoaFees;
    }

    /**
     * Calculate exit/selling costs
     */
    calculateExitCosts(afterRepairValue, sellingCosts = 0) {
        // Default: 8% (6% realtor commission + 2% misc)
        return sellingCosts || (afterRepairValue * 0.08);
    }

    /**
     * Assess deal viability
     */
    assessViability(params) {
        const { netProfit, roi, totalInvestment, holdingPeriod } = params;

        // Criteria for viable micro-flip
        const profitMeetsTarget = netProfit >= this.TARGET_MIN_PROFIT;
        const roiMeetsTarget = roi >= this.TARGET_MIN_ROI;
        const reasonableTimeframe = holdingPeriod <= 180; // 6 months max

        if (profitMeetsTarget && roiMeetsTarget && reasonableTimeframe) {
            return 'excellent';
        } else if (netProfit >= (this.TARGET_MIN_PROFIT * 0.7) && roi >= (this.TARGET_MIN_ROI * 0.7)) {
            return 'good';
        } else if (netProfit > 0 && roi > 5) {
            return 'marginal';
        } else {
            return 'poor';
        }
    }

    /**
     * Rate deal quality
     */
    rateDealQuality(roi, netProfit) {
        if (roi >= this.IDEAL_ROI && netProfit >= this.TARGET_MAX_PROFIT) {
            return 'A+ (Exceptional)';
        } else if (roi >= this.TARGET_MIN_ROI && netProfit >= this.TARGET_MIN_PROFIT) {
            return 'A (Excellent)';
        } else if (roi >= 10 && netProfit >= 1500) {
            return 'B (Good)';
        } else if (roi >= 5 && netProfit > 0) {
            return 'C (Fair)';
        } else {
            return 'D (Poor)';
        }
    }

    /**
     * Assess risk level
     */
    assessRisk(property, viability) {
        const {
            purchasePrice,
            afterRepairValue,
            rehabCosts,
            holdingPeriod
        } = property;

        let riskScore = 0;

        // High rehab costs relative to purchase price
        if ((rehabCosts / purchasePrice) > 0.30) riskScore += 2;
        else if ((rehabCosts / purchasePrice) > 0.20) riskScore += 1;

        // Long holding period
        if (holdingPeriod > 180) riskScore += 2;
        else if (holdingPeriod > 120) riskScore += 1;

        // Low profit margin
        const profitMargin = ((afterRepairValue - (purchasePrice + rehabCosts)) / afterRepairValue);
        if (profitMargin < 0.10) riskScore += 2;
        else if (profitMargin < 0.15) riskScore += 1;

        // Poor viability
        if (viability === 'poor') riskScore += 2;
        else if (viability === 'marginal') riskScore += 1;

        if (riskScore >= 5) return 'high';
        if (riskScore >= 3) return 'medium';
        return 'low';
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(params) {
        const {
            netProfit,
            roi,
            viability,
            seventyPercentRuleMet,
            purchasePrice,
            maxAllowableOffer,
            holdingPeriod
        } = params;

        const recommendations = [];

        // Profit recommendations
        if (netProfit < this.TARGET_MIN_PROFIT) {
            const shortfall = this.TARGET_MIN_PROFIT - netProfit;
            recommendations.push({
                type: 'warning',
                category: 'profit',
                message: `Profit is $${Math.round(shortfall)} below minimum target of $${this.TARGET_MIN_PROFIT}`,
                action: 'Negotiate purchase price down or find ways to reduce rehab costs'
            });
        } else if (netProfit >= this.TARGET_MAX_PROFIT) {
            recommendations.push({
                type: 'success',
                category: 'profit',
                message: `Excellent profit of $${Math.round(netProfit)} exceeds target range`,
                action: 'Strong deal - proceed with confidence'
            });
        }

        // ROI recommendations
        if (roi < this.TARGET_MIN_ROI) {
            recommendations.push({
                type: 'warning',
                category: 'roi',
                message: `ROI of ${roi.toFixed(1)}% is below minimum target of ${this.TARGET_MIN_ROI}%`,
                action: 'Consider passing on this deal or significantly renegotiating terms'
            });
        } else if (roi >= this.IDEAL_ROI) {
            recommendations.push({
                type: 'success',
                category: 'roi',
                message: `Outstanding ROI of ${roi.toFixed(1)}% exceeds ideal target`,
                action: 'High-quality investment opportunity'
            });
        }

        // 70% rule recommendations
        if (!seventyPercentRuleMet) {
            const overpay = purchasePrice - maxAllowableOffer;
            recommendations.push({
                type: 'warning',
                category: 'valuation',
                message: `Purchase price exceeds 70% rule by $${Math.round(overpay)}`,
                action: `Offer no more than $${Math.round(maxAllowableOffer)} for this property`
            });
        }

        // Holding period recommendations
        if (holdingPeriod > 120) {
            recommendations.push({
                type: 'caution',
                category: 'timeline',
                message: `Holding period of ${holdingPeriod} days is longer than ideal`,
                action: 'Factor in additional market risk and potential holding costs'
            });
        }

        // Overall assessment
        if (viability === 'excellent') {
            recommendations.push({
                type: 'success',
                category: 'overall',
                message: 'This is an excellent micro-flip opportunity',
                action: 'Proceed with deal - all key metrics are strong'
            });
        } else if (viability === 'poor') {
            recommendations.push({
                type: 'danger',
                category: 'overall',
                message: 'This deal does not meet micro-flip criteria',
                action: 'Pass on this opportunity and continue searching'
            });
        }

        return recommendations;
    }

    /**
     * Compare multiple deals
     */
    compareDeals(deals) {
        const analyses = deals.map(deal => this.analyzeDeal(deal));
        
        // Rank by ROI and profit
        const ranked = analyses
            .map((analysis, index) => ({
                ...analysis,
                dealIndex: index + 1,
                score: this.calculateDealScore(analysis)
            }))
            .sort((a, b) => b.score - a.score);

        return {
            deals: ranked,
            bestDeal: ranked[0],
            summary: {
                totalDeals: ranked.length,
                viableDeals: ranked.filter(d => ['excellent', 'good'].includes(d.assessment.viability)).length,
                averageROI: ranked.reduce((sum, d) => sum + d.metrics.roi, 0) / ranked.length,
                averageProfit: ranked.reduce((sum, d) => sum + d.metrics.netProfit, 0) / ranked.length
            }
        };
    }

    /**
     * Calculate overall deal score (0-100)
     */
    calculateDealScore(analysis) {
        let score = 0;

        // ROI component (40 points max)
        const roiScore = Math.min((analysis.metrics.roi / this.IDEAL_ROI) * 40, 40);
        score += roiScore;

        // Profit component (30 points max)
        const profitScore = Math.min((analysis.metrics.netProfit / this.TARGET_MAX_PROFIT) * 30, 30);
        score += profitScore;

        // Risk component (20 points max)
        const riskScore = analysis.assessment.riskLevel === 'low' ? 20 
            : analysis.assessment.riskLevel === 'medium' ? 10 
            : 0;
        score += riskScore;

        // 70% rule component (10 points max)
        const seventyPercentScore = analysis.assessment.seventyPercentRuleMet ? 10 : 0;
        score += seventyPercentScore;

        return Math.min(score, 100);
    }

    /**
     * Calculate maximum allowable offer (MAO)
     */
    calculateMAO(afterRepairValue, rehabCosts, desiredProfit = 3500) {
        // MAO = (ARV × 0.70) - Rehab - Desired Profit
        return (afterRepairValue * 0.70) - rehabCosts - desiredProfit;
    }

    /**
     * Estimate rehab costs based on property condition
     */
    estimateRehabCosts(squareFeet, condition = 'average') {
        const costPerSqFt = {
            cosmetic: 15,     // Paint, flooring, fixtures
            average: 30,      // Kitchen, bath updates, systems
            extensive: 50,    // Major renovations, structural
            complete: 75      // Full gut renovation
        };

        return squareFeet * (costPerSqFt[condition] || costPerSqFt.average);
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format percentage for display
     */
    formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroFlipEngine;
}
