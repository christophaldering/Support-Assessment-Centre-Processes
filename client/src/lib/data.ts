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
