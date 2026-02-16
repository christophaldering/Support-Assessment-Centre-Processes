export interface BusinessUnit {
  id: string;
  name: string;
  revenue: number;
  ebitda: number;
  margin: number;
  employees: number;
  tension: string;
  kpis: string[];
  financials: { revenue: number; ebitda: number; margin: number; employees: number };
  yoy: { revenue: number; ebitda: number; deltaRevenue: number; deltaEbitda: number };
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  read: boolean;
  important: boolean;
  content: string;
}

export interface BalanceSheetItem {
  item: string;
  value: number;
}

export interface BalanceSheetSummary {
  name: string;
  value: number;
  type: "asset" | "liability";
}

export interface CaseStudyData {
  id: string;
  name: string;
  description: string;
  metrics: { label: string; value: string; trend: string }[];
  businessUnits: BusinessUnit[];
  emails: Email[];
  detailedBalanceSheet: {
    assets: {
      nonCurrent: BalanceSheetItem[];
      current: BalanceSheetItem[];
    };
    equityLiabilities: {
      equity: BalanceSheetItem[];
      nonCurrentLiabilities: BalanceSheetItem[];
      currentLiabilities: BalanceSheetItem[];
    };
  };
  balanceSheet: BalanceSheetSummary[];
}

export interface CaseEntry {
  id: string;
  title: string;
  subtitle: string;
  status: "active" | "locked";
  type: string;
  difficulty: string;
  description: string;
}

export interface AssessmentQuestions {
  analysis: string[];
  conclusions: string[];
}

export const varexiaData: CaseStudyData = {
  id: "varexia",
  name: "Varexia SE",
  description: "Publicly listed European stock corporation (SE) with a dual management structure.",
  metrics: [
    { label: "Revenue", value: "€42.0 bn", trend: "stable" },
    { label: "EBIT", value: "€1.4 bn", trend: "down" },
    { label: "Employees", value: "284,000", trend: "stable" },
    { label: "Market Value", value: "€28.7 bn", trend: "down-significant" },
  ],
  businessUnits: [
    {
      id: "retail",
      name: "Retail & Consumer Goods",
      revenue: 24.5,
      ebitda: 1.8,
      margin: 7.3,
      employees: 190000,
      tension: "Price leadership vs. profitability",
      kpis: ["Like-for-like sales", "Gross margin", "Working capital"],
      financials: { revenue: 24.5, ebitda: 1.8, margin: 7.3, employees: 190000 },
      yoy: { revenue: 23.82, ebitda: 1.65, deltaRevenue: 0.68, deltaEbitda: 0.15 },
    },
    {
      id: "logistics",
      name: "Logistics & Supply Chain",
      revenue: 8.0,
      ebitda: 0.55,
      margin: 6.9,
      employees: 55000,
      tension: "Speed & reliability vs. cost efficiency",
      kpis: ["Service level (OTIF)", "Cost per case/delivery", "Warehouse utilization"],
      financials: { revenue: 8.0, ebitda: 0.55, margin: 6.9, employees: 55000 },
      yoy: { revenue: 7.6, ebitda: 0.7, deltaRevenue: 0.4, deltaEbitda: -0.15 },
    },
    {
      id: "energy",
      name: "Energy & Infrastructure",
      revenue: 6.5,
      ebitda: 0.75,
      margin: 11.5,
      employees: 25000,
      tension: "Long-term assets vs. short-term returns",
      kpis: ["CAPEX intensity", "ROI/IRR (portfolio)", "Regulatory compliance risk"],
      financials: { revenue: 6.5, ebitda: 0.75, margin: 11.5, employees: 25000 },
      yoy: { revenue: 6.2, ebitda: 0.75, deltaRevenue: 0.3, deltaEbitda: 0 },
    },
    {
      id: "digital",
      name: "Digital Services & Consulting",
      revenue: 3.0,
      ebitda: 0.5,
      margin: 16.7,
      employees: 15000,
      tension: "Scalability vs. people dependency",
      kpis: ["Utilization rate", "Project margin", "Talent retention (key roles)"],
      financials: { revenue: 3.0, ebitda: 0.5, margin: 16.7, employees: 15000 },
      yoy: { revenue: 2.7, ebitda: 0.43, deltaRevenue: 0.3, deltaEbitda: 0.07 },
    },
  ],
  emails: [
    {
      id: "e1",
      from: "Dr. Thomas Berner, Chairman of the Supervisory Board",
      subject: "URGENT: Strategic Review Mandate - Varexia SE",
      date: "Feb 14, 2026, 08:30 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

Welcome to the executive assessment for the Chief Strategy Officer (CSO) position at Varexia SE.

Varexia is facing significant strategic challenges. Our market capitalization has declined from €38.2 billion to €28.7 billion over the past 18 months, reflecting growing investor concern about the Group's strategic direction and operational performance.

The Supervisory Board is requesting a comprehensive strategic review of the Varexia Group. You are expected to analyze the current situation and develop a turnaround strategy that addresses the following critical issues:

1) Retail & Consumer Goods profitability issues — our largest division is underperforming on margins despite stable revenue growth
2) Digital Services & Consulting viability — questions around whether this unit belongs in the portfolio given talent retention challenges and strategic fit
3) Capital allocation conflicts between divisions — particularly between Energy's long-term CAPEX requirements and Retail's cash generation needs

We need a clear, actionable turnaround strategy that can be presented to the full Supervisory Board. Your analysis should demonstrate strategic depth, financial acumen, and the ability to make difficult trade-offs under uncertainty.

Best regards,
Dr. Thomas Berner
Chairman of the Supervisory Board
Varexia SE`,
    },
    {
      id: "e2",
      from: "Marcus Weber, CFO",
      subject: "CONFIDENTIAL: Financial Situation & Covenant Breach Risk",
      date: "Feb 14, 2026, 09:15 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

I wanted to brief you on the financial situation before your strategic review.

Revenue has remained stable at €42.0 billion, but profitability is eroding. Group EBIT stands at €1.4 billion, which represents a concerning decline in margins across several business units.

Free cash flow is barely covering our dividend commitments and essential capital expenditure. The tension between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation capacity is becoming unsustainable.

Most critically, we are approaching a potential debt covenant breach. Our total debt stands at €11.4 billion in bonds plus €9.6 billion in bank loans. The covenant ratios are tightening, and without corrective action, we risk triggering breach clauses within the next 12–18 months.

We need a strategy that releases cash, improves profitability, and creates a sustainable capital structure. Any portfolio decisions must account for the covenant implications.

Best regards,
Marcus Weber
Chief Financial Officer
Varexia SE`,
    },
    {
      id: "e3",
      from: "Sarah Jenkins, Head of HR",
      subject: "Talent Drain in Digital Unit",
      date: "Feb 14, 2026, 10:45 AM",
      read: true,
      important: false,
      content: `Hi,

I wanted to flag an urgent people issue in the Digital Services & Consulting division.

We are experiencing 28% attrition in key technology roles over the past 12 months. Exit interviews consistently cite the same reasons: Varexia is perceived as too bureaucratic, and employees lack the equity upside they could get at startups or pure-play tech companies.

The division's margin of 16.7% looks healthy on paper, but it is trending downward due to the premium salaries we must pay to attract and retain top talent. We are in a vicious cycle — we pay more to retain people, which compresses margins, which makes the business case for the unit harder to justify.

My recommendation is that we either fundamentally fix the governance and incentive structure for Digital Services — potentially including a carve-out with equity participation — or we make the difficult decision to wind down or divest the unit before the talent drain destroys its value entirely.

Best regards,
Sarah`,
    },
    {
      id: "e4",
      from: "Lars Nielsen, CEO Logistics Division",
      subject: "Supply Chain Disruptions & Investment Request",
      date: "Feb 14, 2026, 11:20 AM",
      read: true,
      important: false,
      content: `Dear Strategy Team,

I am writing regarding the rumors of a CAPEX freeze across the Group.

If our logistics automation investment is cut, we will see an estimated 15% rise in cost per case within 12 months. Our competitors are actively automating their supply chains, and we cannot afford to fall further behind.

Currently, 40% of our operations remain semi-manual. The tension between Speed and Cost is breaking us — we are being asked to deliver faster and more reliably while simultaneously cutting costs. This is not sustainable without investment in automation and digital infrastructure.

I urgently need support from the Executive Board to protect the Logistics division's capital budget. Without it, we risk losing our competitive position in a market where efficiency is the primary differentiator.

Best regards,
Lars Nielsen
CEO, Logistics & Supply Chain Division
Varexia SE`,
    },
  ],
  detailedBalanceSheet: {
    assets: {
      nonCurrent: [
        { item: "Goodwill", value: 12384 },
        { item: "Other intangible assets", value: 6358 },
        { item: "Land & buildings", value: 10972 },
        { item: "Plant & equipment", value: 7614 },
        { item: "Construction in progress", value: 2800 },
        { item: "Right-of-use assets - stores & sites", value: 10745 },
        { item: "Right-of-use assets – logistics network", value: 2411 },
        { item: "Right-of-use assets - vehicles & other", value: 762 },
        { item: "Equity investments", value: 3214 },
        { item: "Joint ventures & associates", value: 2001 },
        { item: "Other financial investments", value: 999 },
        { item: "Deferred tax assets", value: 1487 },
      ],
      current: [
        { item: "Inventories – merchandise", value: 6102 },
        { item: "Inventories - packaging & consumables", value: 641 },
        { item: "Inventories - energy commodities", value: 520 },
        { item: "Trade receivables", value: 3781 },
        { item: "Other receivables", value: 1137 },
        { item: "Cash on hand & bank balances", value: 4322 },
        { item: "Short-term deposits", value: 1490 },
      ],
    },
    equityLiabilities: {
      equity: [
        { item: "Share capital", value: 3116 },
        { item: "Capital reserves", value: 6482 },
        { item: "Retained earnings", value: 12996 },
        { item: "Other comprehensive income (OCI)", value: -690 },
      ],
      nonCurrentLiabilities: [
        { item: "Pension provisions - defined benefit", value: 5102 },
        { item: "Other long-term employee benefits", value: 582 },
        { item: "Bonds", value: 11400 },
        { item: "Bank loans (long-term)", value: 9650 },
        { item: "Other financial liabilities (long-term)", value: 2561 },
        { item: "Lease liabilities - stores & sites (LT)", value: 9880 },
        { item: "Lease liabilities - logistics (LT)", value: 1360 },
        { item: "Lease liabilities - other (LT)", value: 502 },
        { item: "Deferred tax liabilities", value: 2816 },
      ],
      currentLiabilities: [
        { item: "Commercial paper / short-term notes", value: 2100 },
        { item: "Bank overdrafts & credit lines", value: 1436 },
        { item: "Current portion of long-term debt", value: 1200 },
        { item: "Lease liabilities - current portion", value: 1610 },
        { item: "Lease liabilities - other current", value: 353 },
        { item: "Trade payables", value: 5912 },
        { item: "Accrued expenses & other current liabilities", value: 1372 },
      ],
    },
  },
  balanceSheet: [
    { name: "Non-current Assets", value: 61.75, type: "asset" },
    { name: "Current Assets", value: 17.99, type: "asset" },
    { name: "Equity", value: 21.90, type: "liability" },
    { name: "Non-current Liabilities", value: 43.85, type: "liability" },
    { name: "Current Liabilities", value: 13.98, type: "liability" },
  ],
};

export const cases: CaseEntry[] = [
  {
    id: "varexia",
    title: "Varexia SE",
    subtitle: "Strategic Review FY 2026",
    status: "active",
    type: "Turnaround Strategy",
    difficulty: "High",
    description: "Multi-divisional European conglomerate facing shareholder pressure and structural inefficiencies.",
  },
  {
    id: "coming-soon",
    title: "Project Helios",
    subtitle: "M&A Due Diligence",
    status: "locked",
    type: "Mergers & Acquisitions",
    difficulty: "Medium",
    description: "Automotive supplier evaluating a cross-border acquisition target.",
  },
];

export const assessmentQuestions: AssessmentQuestions = {
  analysis: [
    "How do you assess the current situation of the Varexia Group based on the available information?",
    "Which patterns, tensions and interdependencies do you see across the organization, the financial profile and the governance system?",
    "Where do you see the most relevant challenges?",
    "Where do you see uncertainty or blind spots that should be named explicitly?",
  ],
  conclusions: [
    "What conclusions do you draw from your analysis?",
    "Which issues require explicit prioritization or decision at Executive Board level?",
    "Where do you see a need for action – and where consciously not?",
    "Which conflicting objectives do you consider structurally irresolvable and therefore requiring a deliberate choice?",
  ],
};
