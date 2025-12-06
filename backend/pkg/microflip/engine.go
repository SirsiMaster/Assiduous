package microflip

import (
	"fmt"
	"time"
)

// Engine implements core micro-flip underwriting logic.
type Engine struct {
	TargetMinProfit float64
	TargetMaxProfit float64
	TargetMinROI    float64
	IdealROI        float64
}

// NewEngine returns an Engine with opinionated defaults matching the
// original JS MicroFlipEngine.
func NewEngine() *Engine {
	return &Engine{
		TargetMinProfit: 2000,
		TargetMaxProfit: 5000,
		TargetMinROI:    15,
		IdealROI:        25,
	}
}

// DealInput captures the inputs required for a micro-flip analysis.
type DealInput struct {
	PurchasePrice    float64 `json:"purchasePrice"`
	AfterRepairValue float64 `json:"afterRepairValue"`
	RehabCosts       float64 `json:"rehabCosts"`
	HoldingPeriod    int     `json:"holdingPeriod"` // days
	ClosingCosts     float64 `json:"closingCosts"`
	SellingCosts     float64 `json:"sellingCosts"`

	FinancingType string  `json:"financingType"` // "cash" or "financed"
	DownPayment   float64 `json:"downPayment"`
	LoanAmount    float64 `json:"loanAmount"`
	InterestRate  float64 `json:"interestRate"` // percent per year

	PropertyTaxes float64 `json:"propertyTaxes"` // annual amount
	Insurance     float64 `json:"insurance"`     // annual amount
	Utilities     float64 `json:"utilities"`     // monthly amount
}

// CostBreakdown mirrors the JS engine's cost breakdown.
type CostBreakdown struct {
	Acquisition float64 `json:"acquisition"`
	Rehab       float64 `json:"rehab"`
	Holding     float64 `json:"holding"`
	Exit        float64 `json:"exit"`
	Total       float64 `json:"total"`
}

// Metrics contains key financial metrics.
type Metrics struct {
	GrossProfit      float64 `json:"grossProfit"`
	NetProfit        float64 `json:"netProfit"`
	ROI              float64 `json:"roi"`
	CashOnCashReturn float64 `json:"cashOnCashReturn"`
	AnnualizedROI    float64 `json:"annualizedROI"`
	TotalInvestment  float64 `json:"totalInvestment"`
	CashInvested     float64 `json:"cashInvested"`
	ProfitMargin     float64 `json:"profitMargin"`
}

// Assessment captures qualitative deal assessment.
type Assessment struct {
	Viability          string  `json:"viability"`
	SeventyPercentRule bool    `json:"seventyPercentRuleMet"`
	MaxAllowableOffer  float64 `json:"maxAllowableOffer"`
	DealQuality        string  `json:"dealQuality"`
	RiskLevel          string  `json:"riskLevel"`
}

// Recommendation represents a single actionable recommendation.
type Recommendation struct {
	Type     string `json:"type"`
	Category string `json:"category"`
	Message  string `json:"message"`
	Action   string `json:"action"`
}

// DealAnalysis is the full analysis payload returned to callers.
type DealAnalysis struct {
	Inputs struct {
		PurchasePrice    float64 `json:"purchasePrice"`
		AfterRepairValue float64 `json:"afterRepairValue"`
		RehabCosts       float64 `json:"rehabCosts"`
		HoldingPeriod    int     `json:"holdingPeriod"`
	} `json:"inputs"`

	Costs           CostBreakdown    `json:"costs"`
	Metrics         Metrics          `json:"metrics"`
	Assessment      Assessment       `json:"assessment"`
	Recommendations []Recommendation `json:"recommendations"`
	AnalyzedAt      time.Time        `json:"analyzedAt"`
}

// AnalyzeDeal runs a full micro-flip analysis similar to the JS engine.
func (e *Engine) AnalyzeDeal(in DealInput) DealAnalysis {
	acq := e.calculateAcquisitionCosts(in.PurchasePrice, in.ClosingCosts)
	holding := e.calculateHoldingCosts(in)
	// Rehab
	rehab := in.RehabCosts
	// Exit costs
	exit := e.calculateExitCosts(in.AfterRepairValue, in.SellingCosts)

	totalInvestment := acq + rehab + holding
	totalCosts := totalInvestment + exit

	grossProfit := in.AfterRepairValue - totalCosts
	netProfit := grossProfit

	var roi float64
	if totalInvestment > 0 {
		roi = (netProfit / totalInvestment) * 100
	}

	var cashInvested float64
	if in.FinancingType == "financed" {
		cashInvested = in.DownPayment + rehab + holding
	} else {
		cashInvested = totalInvestment
	}

	var cashOnCash float64
	if cashInvested > 0 {
		cashOnCash = (netProfit / cashInvested) * 100
	}

	var annualizedROI float64
	if in.HoldingPeriod > 0 {
		annualizedROI = (roi / float64(in.HoldingPeriod)) * 365
	}

	viability := e.assessViability(netProfit, roi, totalInvestment, in.HoldingPeriod)
	maxAllowableOffer := (in.AfterRepairValue * 0.70) - rehab
	seventyRule := in.PurchasePrice <= maxAllowableOffer
	dealQuality := e.rateDealQuality(roi, netProfit)
	riskLevel := e.assessRisk(in, viability)

	profitMargin := 0.0
	if in.AfterRepairValue > 0 {
		profitMargin = (netProfit / in.AfterRepairValue) * 100
	}

	recs := e.generateRecommendations(netProfit, roi, viability, seventyRule, in.PurchasePrice, maxAllowableOffer, in.HoldingPeriod)

	var out DealAnalysis
	out.Inputs.PurchasePrice = in.PurchasePrice
	out.Inputs.AfterRepairValue = in.AfterRepairValue
	out.Inputs.RehabCosts = rehab
	out.Inputs.HoldingPeriod = in.HoldingPeriod

	out.Costs = CostBreakdown{
		Acquisition: acq,
		Rehab:       rehab,
		Holding:     holding,
		Exit:        exit,
		Total:       totalCosts,
	}

	out.Metrics = Metrics{
		GrossProfit:      grossProfit,
		NetProfit:        netProfit,
		ROI:              roi,
		CashOnCashReturn: cashOnCash,
		AnnualizedROI:    annualizedROI,
		TotalInvestment:  totalInvestment,
		CashInvested:     cashInvested,
		ProfitMargin:     profitMargin,
	}

	out.Assessment = Assessment{
		Viability:          viability,
		SeventyPercentRule: seventyRule,
		MaxAllowableOffer:  maxAllowableOffer,
		DealQuality:        dealQuality,
		RiskLevel:          riskLevel,
	}

	out.Recommendations = recs
	out.AnalyzedAt = time.Now().UTC()

	return out
}

func (e *Engine) calculateAcquisitionCosts(purchasePrice, closingCosts float64) float64 {
	if closingCosts == 0 {
		closingCosts = purchasePrice * 0.025
	}
	return purchasePrice + closingCosts
}

func (e *Engine) calculateHoldingCosts(in DealInput) float64 {
	months := float64(in.HoldingPeriod) / 30.0

	// Taxes
	var taxCosts float64
	if in.PropertyTaxes > 0 {
		taxCosts = (in.PropertyTaxes / 12.0) * months
	} else {
		// default 1.2% annual
		taxCosts = (in.PurchasePrice * 0.012 / 12.0) * months
	}

	// Insurance
	var insuranceCosts float64
	if in.Insurance > 0 {
		insuranceCosts = (in.Insurance / 12.0) * months
	} else {
		// default 0.5% annual
		insuranceCosts = (in.PurchasePrice * 0.005 / 12.0) * months
	}

	// Utilities (monthly)
	utilityCosts := in.Utilities * months

	// Interest (if financed)
	var interestCosts float64
	if in.LoanAmount > 0 && in.InterestRate > 0 {
		interestCosts = (in.LoanAmount * (in.InterestRate / 100.0) / 12.0) * months
	}

	// HOA placeholder (0 for now)
	hoaFees := 0.0

	return taxCosts + insuranceCosts + utilityCosts + interestCosts + float64(hoaFees)
}

func (e *Engine) calculateExitCosts(arv, sellingCosts float64) float64 {
	if sellingCosts == 0 {
		// 8% default (6% commission + 2% misc)
		return arv * 0.08
	}
	return sellingCosts
}

func (e *Engine) assessViability(netProfit, roi, totalInvestment float64, holdingPeriod int) string {
	profitMeets := netProfit >= e.TargetMinProfit
	roiMeets := roi >= e.TargetMinROI
	reasonable := holdingPeriod <= 180

	if profitMeets && roiMeets && reasonable {
		return "excellent"
	}
	if netProfit >= (e.TargetMinProfit*0.7) && roi >= (e.TargetMinROI*0.7) {
		return "good"
	}
	if netProfit > 0 && roi > 5 {
		return "marginal"
	}
	return "poor"
}

func (e *Engine) rateDealQuality(roi, netProfit float64) string {
	if roi >= e.IdealROI && netProfit >= e.TargetMaxProfit {
		return "A+ (Exceptional)"
	}
	if roi >= e.TargetMinROI && netProfit >= e.TargetMinProfit {
		return "A (Excellent)"
	}
	if roi >= 10 && netProfit >= 1500 {
		return "B (Good)"
	}
	if roi >= 5 && netProfit > 0 {
		return "C (Fair)"
	}
	return "D (Poor)"
}

func (e *Engine) assessRisk(in DealInput, viability string) string {
	purchasePrice := in.PurchasePrice
	arv := in.AfterRepairValue
	rehab := in.RehabCosts
	holdingPeriod := in.HoldingPeriod

	var riskScore int

	if purchasePrice > 0 {
		ratio := rehab / purchasePrice
		if ratio > 0.30 {
			riskScore += 2
		} else if ratio > 0.20 {
			riskScore += 1
		}
	}

	if holdingPeriod > 180 {
		riskScore += 2
	} else if holdingPeriod > 120 {
		riskScore += 1
	}

	if arv > 0 {
		profitMargin := (arv - (purchasePrice + rehab)) / arv
		if profitMargin < 0.10 {
			riskScore += 2
		} else if profitMargin < 0.15 {
			riskScore += 1
		}
	}

	if viability == "poor" {
		riskScore += 2
	} else if viability == "marginal" {
		riskScore += 1
	}

	if riskScore >= 5 {
		return "high"
	}
	if riskScore >= 3 {
		return "medium"
	}
	return "low"
}

func (e *Engine) generateRecommendations(netProfit, roi float64, viability string, seventyRuleMet bool, purchasePrice, maxAllowableOffer float64, holdingPeriod int) []Recommendation {
	recs := make([]Recommendation, 0, 6)

	// Profit
	if netProfit < e.TargetMinProfit {
		shortfall := e.TargetMinProfit - netProfit
		recs = append(recs, Recommendation{
			Type:     "warning",
			Category: "profit",
			Message:  "Profit is below minimum target by approximately $" + formatRounded(shortfall),
			Action:   "Negotiate purchase price down or reduce rehab costs",
		})
	} else if netProfit >= e.TargetMaxProfit {
		recs = append(recs, Recommendation{
			Type:     "success",
			Category: "profit",
			Message:  "Profit exceeds upper target range",
			Action:   "Strong deal - proceed with confidence",
		})
	}

	// ROI
	if roi < e.TargetMinROI {
		recs = append(recs, Recommendation{
			Type:     "warning",
			Category: "roi",
			Message:  "ROI is below minimum target",
			Action:   "Consider renegotiating or passing on this deal",
		})
	} else if roi >= e.IdealROI {
		recs = append(recs, Recommendation{
			Type:     "success",
			Category: "roi",
			Message:  "ROI exceeds ideal target",
			Action:   "High-quality investment opportunity",
		})
	}

	// 70% rule
	if !seventyRuleMet {
		overpay := purchasePrice - maxAllowableOffer
		recs = append(recs, Recommendation{
			Type:     "warning",
			Category: "valuation",
			Message:  "Purchase price exceeds 70% rule by approximately $" + formatRounded(overpay),
			Action:   "Offer no more than about $" + formatRounded(maxAllowableOffer),
		})
	}

	// Holding period
	if holdingPeriod > 120 {
		recs = append(recs, Recommendation{
			Type:     "caution",
			Category: "timeline",
			Message:  "Holding period is longer than ideal",
			Action:   "Factor in additional market and holding-cost risk",
		})
	}

	// Overall assessment
	if viability == "excellent" {
		recs = append(recs, Recommendation{
			Type:     "success",
			Category: "overall",
			Message:  "This is an excellent micro-flip opportunity",
			Action:   "Proceed - all key metrics are strong",
		})
	} else if viability == "poor" {
		recs = append(recs, Recommendation{
			Type:     "danger",
			Category: "overall",
			Message:  "This deal does not meet micro-flip criteria",
			Action:   "Pass on this opportunity and continue searching",
		})
	}

	return recs
}

// formatRounded is a tiny helper to avoid importing fmt just for whole-dollar values.
func formatRounded(v float64) string {
	if v < 0 {
		v = -v
	}
	// Simple rounding to nearest hundred for messaging to keep values readable.
	// e.g. 2345 -> 2300, 2875 -> 2900.
	const unit = 100.0
	res := int((v+unit/2)/unit) * int(unit)
	return fmt.Sprintf("%d", res)
}
