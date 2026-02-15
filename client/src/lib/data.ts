
export const companyData = {
  name: "Varexia SE",
  metrics: [
    { label: "Revenue", value: "€42.0 bn", trend: "stable" },
    { label: "EBIT", value: "€1.4 bn", trend: "down" },
    { label: "Employees", value: "284,000", trend: "stable" },
    { label: "Market Value", value: "€28.7 bn", trend: "down-significant" },
  ],
  businessUnits: [
    {
      name: "Retail & Consumer Goods",
      revenue: 24.5,
      ebitda: 1.8,
      margin: 7.3,
      employees: 190000,
      tension: "Price leadership vs. profitability"
    },
    {
      name: "Logistics & Supply Chain",
      revenue: 8.0,
      ebitda: 0.55,
      margin: 6.9,
      employees: 55000,
      tension: "Speed & reliability vs. cost efficiency"
    },
    {
      name: "Energy & Infrastructure",
      revenue: 6.5,
      ebitda: 0.75,
      margin: 11.5,
      employees: 25000,
      tension: "Long-term assets vs. short-term returns"
    },
    {
      name: "Digital Services & Consulting",
      revenue: 3.0,
      ebitda: 0.5,
      margin: 16.7,
      employees: 15000,
      tension: "Scalability vs. people dependency"
    }
  ],
  balanceSheet: [
    { name: "Non-current Assets", value: 61.75, type: "asset" },
    { name: "Current Assets", value: 17.99, type: "asset" },
    { name: "Equity", value: 21.90, type: "liability" },
    { name: "Non-current Liabilities", value: 43.85, type: "liability" },
    { name: "Current Liabilities", value: 13.98, type: "liability" }
  ]
};

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
