// Varexia Data (Module 1)
export const varexiaData = {
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
      yoy: { revenue: 23.82, ebitda: 1.65, deltaRevenue: 0.68, deltaEbitda: 0.15 }
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
      yoy: { revenue: 7.6, ebitda: 0.7, deltaRevenue: 0.4, deltaEbitda: -0.15 }
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
      yoy: { revenue: 6.2, ebitda: 0.75, deltaRevenue: 0.3, deltaEbitda: 0 }
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
      yoy: { revenue: 2.7, ebitda: 0.43, deltaRevenue: 0.3, deltaEbitda: 0.07 }
    }
  ],
  emails: [
    {
      id: "e1",
      from: "Dr. Thomas Berner, Chairman of the Supervisory Board",
      subject: "URGENT: Strategic Review Mandate - Varexia SE",
      date: "Feb 14, 2026, 08:30 AM",
      read: false,
      important: true,
      content: `Dear Colleague,

Welcome to the executive assessment for the Chief Strategy Officer position at Varexia SE.

As you are aware, Varexia is currently facing one of the most challenging periods in its history. Despite our strong market position in Retail and Logistics, our overall market capitalization has declined significantly over the last 12 months. Shareholder pressure is mounting, and there are growing concerns about our conglomerate structure.

Your mandate today is to conduct a comprehensive strategic review of the group. We need you to analyze the current situation, identify the key tensions across our business units, and propose a clear path forward.

Specifically, I need you to address:
1. The profitability issues in our Retail division.
2. The strategic viability of our Digital Services unit.
3. The capital allocation conflicts between our mature and growth businesses.

I expect a clear, unvarnished assessment. We do not need more "business as usual" - we need a turnaround strategy.

Best regards,

Dr. Thomas Berner
Chairman of the Supervisory Board
Varexia SE`
    },
    {
      id: "e2",
      from: "Marcus Weber, CFO",
      subject: "CONFIDENTIAL: Financial Situation & Covenant Breach Risk",
      date: "Feb 14, 2026, 09:15 AM",
      read: false,
      important: true,
      content: `Privileged & Confidential

Following up on Dr. Berner's note, I must draw your attention to our immediate financial constraints.

While our top-line revenue remains stable at €42.0bn, our profitability is eroding faster than expected. Group EBIT has fallen to €1.4bn, and our free cash flow is barely covering our dividend commitments and necessary CAPEX.

Most critically, please look closely at the "Energy & Infrastructure" CAPEX requirements vs. the "Retail" cash generation. We are dangerously close to breaching our debt covenants if EBITDA drops any further.

I have uploaded the FY2025 financial statements to the Data Room. Please review the "Non-Current Liabilities" section carefully - our debt pile of €11.4bn in bonds and €9.6bn in bank loans is becoming a heavy burden in this high-interest environment.

We need a strategy that releases cash, not just consumes it.

Regards,

Marcus Weber
Chief Financial Officer`
    },
    {
      id: "e3",
      from: "Sarah Jenkins, Head of HR",
      subject: "Talent Drain in Digital Unit",
      date: "Feb 14, 2026, 10:45 AM",
      read: true,
      important: false,
      content: `Hi there,

Just wanted to flag a critical issue coming from the "Digital Services & Consulting" unit. 

We are seeing an annualized attrition rate of 28% in key technical roles. The exit interviews are consistent: top talent is leaving because they feel Varexia is too bureaucratic and they lack "true" equity upside compared to startups.

The "Strategic Tension" noted in the business unit profile ("Scalability vs. people dependency") is very real. We are currently paying premium salaries to retain consultants, which is destroying the unit's margin (currently 16.7%, but trending down).

If we don't fix the governance or incentive structure for Digital, we might as well shut it down.

Best,
Sarah`
    },
    {
      id: "e4",
      from: "Lars Nielsen, CEO Logistics Division",
      subject: "Supply Chain Disruptions & Investment Request",
      date: "Feb 14, 2026, 11:20 AM",
      read: true,
      important: false,
      content: `Good morning,

I'm hearing rumors of a CAPEX freeze across the group. I must warn you: if we cut investment in the Logistics automation project, our "Cost per case" will rise by at least 15% next year due to labor inflation.

Our competitors are fully automating their warehouses. We are still running semi-manual operations in 40% of our sites. The "Speed vs. Cost" tension is breaking us. We cannot be both the fastest AND the cheapest without significant technology investment.

I need your support to protect the Logistics budget in the upcoming board meeting.

Regards,
Lars`
    }
  ],
  detailedBalanceSheet: {
    assets: {
      nonCurrent: [
        { item: "Goodwill", value: 12384.00 },
        { item: "Other intangible assets", value: 6358.00 },
        { item: "Land & buildings", value: 10972.00 },
        { item: "Plant & equipment", value: 7614.00 },
        { item: "Construction in progress", value: 2800.00 },
        { item: "Right-of-use assets - stores & sites", value: 10745.00 },
        { item: "Right-of-use assets – logistics network", value: 2411.00 },
        { item: "Right-of-use assets - vehicles & other", value: 762.00 },
        { item: "Equity investments", value: 3214.00 },
        { item: "Joint ventures & associates", value: 2001.00 },
        { item: "Other financial investments", value: 999.00 },
        { item: "Deferred tax assets", value: 1487.00 }
      ],
      current: [
        { item: "Inventories – merchandise", value: 6102.00 },
        { item: "Inventories - packaging & consumables", value: 641.00 },
        { item: "Inventories - energy commodities", value: 520.00 },
        { item: "Trade receivables", value: 3781.00 },
        { item: "Other receivables", value: 1137.00 },
        { item: "Cash on hand & bank balances", value: 4322.00 },
        { item: "Short-term deposits", value: 1490.00 }
      ]
    },
    equityLiabilities: {
      equity: [
        { item: "Share capital", value: 3116.00 },
        { item: "Capital reserves", value: 6482.00 },
        { item: "Retained earnings", value: 12996.00 },
        { item: "Other comprehensive income (OCI)", value: -690.00 }
      ],
      nonCurrentLiabilities: [
        { item: "Pension provisions - defined benefit", value: 5102.00 },
        { item: "Other long-term employee benefits", value: 582.00 },
        { item: "Bonds", value: 11400.00 },
        { item: "Bank loans (long-term)", value: 9650.00 },
        { item: "Other financial liabilities (long-term)", value: 2561.00 },
        { item: "Lease liabilities - stores & sites (LT)", value: 9880.00 },
        { item: "Lease liabilities - logistics (LT)", value: 1360.00 },
        { item: "Lease liabilities - other (LT)", value: 502.00 },
        { item: "Deferred tax liabilities", value: 2816.00 }
      ],
      currentLiabilities: [
        { item: "Commercial paper / short-term notes", value: 2100.00 },
        { item: "Bank overdrafts & credit lines", value: 1436.00 },
        { item: "Current portion of long-term debt", value: 1200.00 },
        { item: "Lease liabilities - current portion", value: 1610.00 },
        { item: "Lease liabilities - other current", value: 353.00 },
        { item: "Trade payables", value: 5912.00 },
        { item: "Accrued expenses & other current liabilities", value: 1372.00 }
      ]
    }
  },
  balanceSheet: [
    { name: "Non-current Assets", value: 61.75, type: "asset" },
    { name: "Current Assets", value: 17.99, type: "asset" },
    { name: "Equity", value: 21.90, type: "liability" },
    { name: "Non-current Liabilities", value: 43.85, type: "liability" },
    { name: "Current Liabilities", value: 13.98, type: "liability" }
  ]
};

// Case Registry
export const cases = [
  {
    id: "varexia",
    title: "Varexia SE",
    subtitle: "Strategic Review FY 2026",
    status: "active",
    type: "Turnaround Strategy",
    difficulty: "High",
    description: "Multi-divisional European conglomerate facing shareholder pressure and structural inefficiencies.",
    data: varexiaData
  },
  {
    id: "coming-soon",
    title: "Project Helios",
    subtitle: "M&A Due Diligence",
    status: "locked",
    type: "Mergers & Acquisitions",
    difficulty: "Medium",
    description: "Automotive supplier evaluating a cross-border acquisition target.",
    data: null
  }
];

export const assessmentQuestions = {
  analysis: [
    "How do you assess the current situation of the Varexia Group based on the available information?",
    "Which patterns, tensions and interdependencies do you see across the organization, the financial profile and the governance system?",
    "Where do you see the most relevant challenges?",
    "Where do you see uncertainty or blind spots that should be named explicitly?"
  ],
  conclusions: [
    "What conclusions do you draw from your analysis?",
    "Which issues require explicit prioritization or decision at Executive Board level?",
    "Where do you see a need for action – and where consciously not?",
    "Which conflicting objectives do you consider structurally irresolvable and therefore requiring a deliberate choice?"
  ]
};
