/**
 * MicroFlipEngine (UI helper only)
 * --------------------------------
 * Historical JS implementation of micro-flip deal math.
 *
 * IMPORTANT ARCHITECTURE NOTE
 * ---------------------------
 * The authoritative underwriting logic now lives in the Go microflip.Engine
 * and is exposed via the /api/microflip HTTP endpoints. All real financial
 * calculations (ROI, profit, cost breakdowns, portfolio metrics) must go
 * through those endpoints using MicroFlipApiClient.
 *
 * This class is retained ONLY for presentation concerns:
 *   - scoring deals (calculateDealScore)
 *   - local caching of analyses (saveDeal / getSavedDeals / deleteDeal)
 *   - formatting helpers (formatCurrency / formatPercent)
 *
 * Do NOT use MicroFlipEngine.analyzeDeal or the internal math here as a
 * source of truth for underwriting. If you need new analytics, add them to
 * the Go engine and surface them via /api/microflip instead.
 */
class MicroFlipEngine {
    constructor() {
        this.dealCache = new Map();
    }

    /**
     * Analyze a deal with all parameters
     * @param {Object} property - Property data
     * @param {Object} financing - Financing parameters
     * @returns {Object} Complete deal analysis
     */
    analyzeDeal(property, financing) {
        const analysis = {
            property: property,
            financing: financing,
            acquisition: this.calculateAcquisition(property, financing),
            renovation: this.calculateRenovation(property),
            holding: this.calculateHoldingCosts(property, financing),
            disposition: this.calculateDisposition(property),
            returns: null,
            timeline: this.estimateTimeline(property)
        };

        // Calculate total returns
        analysis.returns = this.calculateReturns(analysis);
        
        // Add risk assessment
        analysis.risk = this.assessRisk(analysis);
        
        // Add recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    /**
     * Calculate acquisition costs
     */
    calculateAcquisition(property, financing) {
        const purchasePrice = property.price || property.price?.list || 0;
        const downPaymentPercent = financing.downPayment || 20;
        const closingCostPercent = financing.closingCosts || 3;

        const downPayment = purchasePrice * (downPaymentPercent / 100);
        const loanAmount = purchasePrice - downPayment;
        const closingCosts = purchasePrice * (closingCostPercent / 100);
        const inspectionFees = 500;
        const appraisalFee = 500;
        const miscFees = 1000;

        return {
            purchasePrice,
            downPayment,
            loanAmount,
            closingCosts,
            inspectionFees,
            appraisalFee,
            miscFees,
            totalCash: downPayment + closingCosts + inspectionFees + appraisalFee + miscFees
        };
    }

    /**
     * Calculate renovation costs
     */
    calculateRenovation(property) {
        const estimatedRepairs = property.repairCosts || property.price?.repair || 0;
        const contingency = estimatedRepairs * 0.15; // 15% contingency
        const permitsFees = 2000;
        const designCosts = 1500;

        return {
            materials: estimatedRepairs * 0.6,
            labor: estimatedRepairs * 0.4,
            estimatedRepairs,
            contingency,
            permitsFees,
            designCosts,
            totalRenovation: estimatedRepairs + contingency + permitsFees + designCosts
        };
    }

    /**
     * Calculate holding costs
     */
    calculateHoldingCosts(property, financing) {
        const purchasePrice = property.price || property.price?.list || 0;
        const loanAmount = purchasePrice * (1 - (financing.downPayment || 20) / 100);
        const interestRate = financing.interestRate || 7;
        const holdingMonths = 6; // Estimate 6 months

        const monthlyMortgage = this.calculateMonthlyPayment(
            loanAmount,
            interestRate,
            financing.loanTerm || 30
        );
        
        const propertyTax = (purchasePrice * 0.012) / 12 * holdingMonths; // 1.2% annual
        const insurance = 150 * holdingMonths;
        const utilities = 200 * holdingMonths;
        const hoa = (property.hoaFees || 0) * holdingMonths;

        return {
            monthlyMortgage,
            mortgageTotal: monthlyMortgage * holdingMonths,
            propertyTax,
            insurance,
            utilities,
            hoa,
            holdingMonths,
            totalHolding: (monthlyMortgage * holdingMonths) + propertyTax + insurance + utilities + hoa
        };
    }

    /**
     * Calculate disposition (selling) costs
     */
    calculateDisposition(property) {
        const arv = property.arv || property.price?.arv || property.price * 1.2;
        const realtorCommission = arv * 0.06; // 6%
        const sellerClosingCosts = arv * 0.02; // 2%
        const staging = 3000;
        const photography = 500;

        return {
            arv,
            realtorCommission,
            sellerClosingCosts,
            staging,
            photography,
            totalDisposition: realtorCommission + sellerClosingCosts + staging + photography
        };
    }

    /**
     * Calculate overall returns
     */
    calculateReturns(analysis) {
        const totalInvestment = 
            analysis.acquisition.totalCash +
            analysis.renovation.totalRenovation +
            analysis.holding.totalHolding +
            analysis.disposition.totalDisposition;

        const saleProceeds = analysis.disposition.arv;
        const loanPayoff = analysis.acquisition.loanAmount;
        
        const netProfit = saleProceeds - loanPayoff - totalInvestment;
        const roi = (netProfit / totalInvestment) * 100;
        const annualizedROI = roi * (12 / analysis.holding.holdingMonths);
        const cashOnCash = (netProfit / analysis.acquisition.totalCash) * 100;

        return {
            totalInvestment,
            saleProceeds,
            loanPayoff,
            netProfit,
            roi,
            annualizedROI,
            cashOnCash,
            profitMargin: (netProfit / saleProceeds) * 100
        };
    }

    /**
     * Calculate monthly mortgage payment
     */
    calculateMonthlyPayment(principal, annualRate, years) {
        const monthlyRate = (annualRate / 100) / 12;
        const numberOfPayments = years * 12;
        
        if (monthlyRate === 0) return principal / numberOfPayments;
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    /**
     * Estimate project timeline
     */
    estimateTimeline(property) {
        const repairCosts = property.repairCosts || property.price?.repair || 0;
        
        // Estimate renovation time based on repair costs
        const renovationWeeks = Math.ceil(repairCosts / 10000); // 1 week per $10k
        const renovationMonths = Math.ceil(renovationWeeks / 4);

        return {
            acquisition: 4, // weeks
            renovationWeeks,
            renovationMonths,
            listing: 2, // weeks
            sale: 4, // weeks
            totalWeeks: 4 + renovationWeeks + 2 + 4,
            totalMonths: Math.ceil((4 + renovationWeeks + 2 + 4) / 4)
        };
    }

    /**
     * Assess deal risk
     */
    assessRisk(analysis) {
        const risks = [];
        let riskScore = 0;

        // ROI risk
        if (analysis.returns.roi < 15) {
            risks.push({ level: 'high', message: 'ROI below 15% target' });
            riskScore += 30;
        } else if (analysis.returns.roi < 25) {
            risks.push({ level: 'medium', message: 'ROI below 25% optimal' });
            riskScore += 15;
        }

        // Market risk
        const arvMultiple = analysis.disposition.arv / analysis.acquisition.purchasePrice;
        if (arvMultiple < 1.2) {
            risks.push({ level: 'high', message: 'ARV margin too thin (< 20%)' });
            riskScore += 25;
        }

        // Timeline risk
        if (analysis.timeline.totalMonths > 8) {
            risks.push({ level: 'medium', message: 'Extended timeline increases holding costs' });
            riskScore += 15;
        }

        // Renovation risk
        const renovationToPrice = analysis.renovation.totalRenovation / analysis.acquisition.purchasePrice;
        if (renovationToPrice > 0.3) {
            risks.push({ level: 'high', message: 'Renovation exceeds 30% of purchase price' });
            riskScore += 20;
        }

        return {
            score: Math.min(riskScore, 100),
            level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
            risks
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.returns.roi >= 25) {
            recommendations.push({
                type: 'positive',
                message: 'Strong ROI - Excellent deal opportunity'
            });
        }

        if (analysis.returns.cashOnCash >= 50) {
            recommendations.push({
                type: 'positive',
                message: 'High cash-on-cash return - Good use of leverage'
            });
        }

        if (analysis.timeline.totalMonths <= 6) {
            recommendations.push({
                type: 'positive',
                message: 'Quick flip timeline minimizes holding costs'
            });
        }

        if (analysis.risk.score >= 60) {
            recommendations.push({
                type: 'warning',
                message: 'Consider negotiating purchase price or verifying ARV'
            });
        }

        if (analysis.renovation.totalRenovation > analysis.acquisition.purchasePrice * 0.25) {
            recommendations.push({
                type: 'caution',
                message: 'High renovation costs - ensure contractor quotes are accurate'
            });
        }

        return recommendations;
    }

    /**
     * Compare multiple deals
     */
    compareDeals(analyses) {
        return analyses.map(analysis => ({
            property: analysis.property,
            roi: analysis.returns.roi,
            netProfit: analysis.returns.netProfit,
            cashOnCash: analysis.returns.cashOnCash,
            riskScore: analysis.risk.score,
            totalMonths: analysis.timeline.totalMonths,
            score: this.calculateDealScore(analysis)
        })).sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate overall deal score (0-100)
     */
    calculateDealScore(analysis) {
        const roiScore = Math.min(analysis.returns.roi * 2, 50); // Max 50 points
        const riskScore = 25 - (analysis.risk.score / 4); // Max 25 points (inverse of risk)
        const timelineScore = Math.max(25 - (analysis.timeline.totalMonths * 2), 0); // Max 25 points

        return Math.round(roiScore + riskScore + timelineScore);
    }

    /**
     * Save analyzed deal
     */
    saveDeal(dealId, analysis) {
        this.dealCache.set(dealId, {
            ...analysis,
            savedAt: new Date().toISOString()
        });
        
        // Also save to localStorage
        try {
            const saved = JSON.parse(localStorage.getItem('savedDeals') || '{}');
            saved[dealId] = analysis;
            localStorage.setItem('savedDeals', JSON.stringify(saved));
        } catch (error) {
            console.error('Error saving deal:', error);
        }
    }

    /**
     * Load saved deals
     */
    getSavedDeals() {
        try {
            return JSON.parse(localStorage.getItem('savedDeals') || '{}');
        } catch (error) {
            console.error('Error loading saved deals:', error);
            return {};
        }
    }

    /**
     * Delete saved deal
     */
    deleteDeal(dealId) {
        this.dealCache.delete(dealId);
        
        try {
            const saved = JSON.parse(localStorage.getItem('savedDeals') || '{}');
            delete saved[dealId];
            localStorage.setItem('savedDeals', JSON.stringify(saved));
        } catch (error) {
            console.error('Error deleting deal:', error);
        }
    }

    /**
     * Format currency
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
     * Format percentage
     */
    formatPercent(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroFlipEngine;
}
