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
  news: [
    {
      id: "n1",
      source: "Financial Times",
      sourceTag: "FT",
      category: "Companies",
      date: "February 13, 2026",
      headline: "Varexia faces investor revolt over conglomerate discount",
      subheadline: "Activist fund Corvus Capital builds 4.8% stake and demands break-up of European industrial group",
      author: "James Whitfield, European Industry Correspondent",
      content: `Varexia SE, the Frankfurt-listed conglomerate, is facing mounting pressure from activist investors demanding a radical restructuring of the group, according to people familiar with the matter.

Corvus Capital, a London-based activist hedge fund, has quietly amassed a 4.8 per cent stake in the company over the past six months and is now pushing for a break-up of the sprawling industrial group, which spans retail, logistics, energy infrastructure and digital consulting.

The fund argues that Varexia's current market capitalisation of €28.7bn significantly undervalues the sum of its parts, with the conglomerate discount estimated at 25-30 per cent. "The board has failed to articulate a coherent portfolio strategy," said a person close to Corvus. "There is no strategic rationale for housing a supermarket chain and an energy infrastructure business under the same roof."

Varexia's shares have declined 18 per cent over the past 12 months, lagging the Euro Stoxx 50 by a wide margin. The group's EBIT margin has compressed to just 3.3 per cent on revenues of €42bn, well below peers in each of its operating segments.

Dr Thomas Berner, chairman of the supervisory board, declined to comment on specific investor demands but acknowledged in a recent speech that "the status quo is not an option" and that the board was "conducting a thorough strategic review."

Industry analysts have long questioned the logic of Varexia's diversified structure. "The retail business generates cash but needs investment. Energy eats capital. Digital lacks scale. And logistics is caught between automation costs and margin pressure," said Katharina Schulz, an analyst at Berenberg. "Something has to give."

The supervisory board is expected to announce the appointment of a new chief strategy officer within weeks, a move seen as a precursor to major portfolio changes. Corvus has indicated it will seek board representation at the next annual general meeting if progress is not forthcoming.`
    },
    {
      id: "n2",
      source: "Handelsblatt",
      sourceTag: "HB",
      category: "Unternehmen",
      date: "February 12, 2026",
      headline: "Varexia SE: Kreditklauseln unter Druck - Analysten warnen vor Herabstufung",
      subheadline: "Die Verschuldung des Mischkonzerns nähert sich kritischen Schwellenwerten. S&P erwägt Ausblickänderung.",
      author: "Dr. Markus Engel, Finanzredaktion",
      content: `Frankfurt — Die finanzielle Lage des Mischkonzerns Varexia SE gibt Analysten und Ratingagenturen zunehmend Anlass zur Sorge. Nach Informationen des Handelsblatts prüft S&P Global Ratings eine Änderung des Ausblicks von "stabil" auf "negativ" für das aktuelle BBB-Rating des Unternehmens.

[Translation for case context: The financial situation of conglomerate Varexia SE is increasingly worrying analysts and rating agencies. According to Handelsblatt sources, S&P Global Ratings is reviewing a potential outlook change from "stable" to "negative" for the company's current BBB rating.]

The group's total financial debt stands at approximately €21bn when including bonds (€11.4bn), bank loans (€9.6bn), and other financial liabilities. With lease obligations adding a further €13.9bn to the balance sheet, the enterprise value leverage is approaching levels that could trigger covenant breaches on the syndicated credit facility.

"The key metric to watch is Net Debt/EBITDA," wrote Christina Hartmann of Deutsche Bank in a recent note. "At current EBITDA levels of approximately €3.8bn, the ratio is already at 5.5x. Their covenant ceiling is 6.0x. One bad quarter in Retail and they breach."

CFO Marcus Weber has reportedly been in discussions with the group's relationship banks to negotiate a temporary relaxation of covenant terms, though no agreement has been reached. The €2.1bn commercial paper programme, which requires constant rollover, adds further refinancing risk in the current interest rate environment.

The company's pension obligations of €5.1bn represent an additional burden that is often overlooked in headline leverage calculations. "When you add pensions to the adjusted leverage, you get a very different — and much more alarming — picture," noted a fixed-income analyst at a major European bank.

Varexia's bonds maturing in 2027 are currently trading at spreads of 185 basis points over Bunds, up from 120bps six months ago, reflecting growing credit market concern.`
    },
    {
      id: "n3",
      source: "Financial Times",
      sourceTag: "FT",
      category: "Lex Column",
      date: "February 11, 2026",
      headline: "Lex: Varexia — the conglomerate that time forgot",
      subheadline: "",
      author: "Lex Column",
      content: `Some conglomerates justify their existence through superior capital allocation. Others through operational synergies. Varexia SE appears to justify its existence through inertia alone.

The numbers tell a damning story. Group EBIT margins of 3.3 per cent compare unfavourably with pure-play competitors in every single segment. The retail operation, which accounts for 58 per cent of revenues, runs on a wafer-thin 7.3 per cent EBITDA margin — roughly 300 basis points below leading European food retailers. The logistics arm, while showing growth, faces a binary choice between massive capital expenditure and competitive irrelevance.

Then there is "Digital Services & Consulting" (€3bn revenues, 15,000 employees), a unit that exists in an uncomfortable no-man's land: too small to compete with Accenture, too corporate to attract top tech talent, and too unprofitable to justify further investment. Annualised attrition of 28 per cent in key roles tells you everything you need to know.

The energy and infrastructure division, meanwhile, is consuming capital at a rate that would make sense only if Varexia were a dedicated energy transition vehicle — which it emphatically is not.

Market capitalisation: €28.7bn. Conservative sum-of-the-parts valuation: €37-40bn. That gap represents approximately €10bn of value destruction attributable to the conglomerate structure itself.

The prescription is clear, even if politically unpalatable: sell Digital, IPO Logistics, ring-fence Energy's capital needs, and let Retail generate the cash flow it is capable of producing without subsidising three other businesses.

The question is whether the supervisory board has the courage to act before Corvus Capital forces its hand.`
    },
    {
      id: "n4",
      source: "Reuters",
      sourceTag: "R",
      category: "Business News",
      date: "February 10, 2026",
      headline: "Varexia logistics unit eyes €800m automation investment amid group-wide CAPEX freeze",
      subheadline: "Internal tensions rise as divisions compete for shrinking capital budget",
      author: "Anna Kowalski, Reuters Frankfurt",
      content: `FRANKFURT (Reuters) — Varexia SE's logistics division is pushing for an €800 million automation investment programme over the next three years, even as the parent company considers a group-wide capital expenditure freeze, three people with knowledge of the matter told Reuters.

The investment, which would cover warehouse robotics, automated sorting systems, and last-mile delivery technology across 40 per cent of the division's sites that still run semi-manual operations, is seen as critical to maintaining competitiveness in the rapidly consolidating European logistics sector.

"Without this investment, our cost per case will increase by at least 15 per cent next year due to labour inflation alone," said one person close to the logistics division's management. "Our competitors are fully automated. We are falling behind."

However, the investment request comes at a difficult time. Varexia's group-level free cash flow is barely sufficient to cover its €1.2bn annual dividend commitment and essential maintenance capital expenditure. The Energy & Infrastructure division is simultaneously requesting significant CAPEX for grid modernisation projects.

"There is a fundamental capital allocation conflict at the heart of this group," said a senior banker advising the company. "You cannot simultaneously fund a logistics automation programme, an energy transition, and maintain a progressive dividend policy on €42bn of revenues generating only €1.4bn of EBIT."

Shares in Varexia fell 2.3 per cent on the Frankfurt exchange on Monday to €47.82, bringing the year-to-date decline to 14 per cent. The stock has underperformed the DAX by approximately 22 percentage points over the past 12 months.

A Varexia spokesperson said the company "continuously evaluates investment priorities across all divisions" and that "all capital allocation decisions are made in the context of our overall group strategy."`
    },
    {
      id: "n5",
      source: "Handelsblatt",
      sourceTag: "HB",
      category: "Technologie",
      date: "February 8, 2026",
      headline: "Talentflucht bei Varexia Digital: 'Wir verlieren den Krieg um die besten Köpfe'",
      subheadline: "Die Digitalsparte des Konzerns kämpft mit einer Fluktuation von 28 Prozent. Interne Dokumente zeigen das Ausmaß der Krise.",
      author: "Lena Berger, Technologie-Redaktion",
      content: `Düsseldorf — Interne Dokumente, die dem Handelsblatt vorliegen, zeichnen ein düsteres Bild der Personalentwicklung in Varexias Digitalsparte "Digital Services & Consulting."

[Translation for case context: Internal documents obtained by Handelsblatt paint a grim picture of workforce development in Varexia's digital division "Digital Services & Consulting."]

The unit, which employs approximately 15,000 people and generates €3bn in annual revenue, is experiencing an annualised attrition rate of 28 per cent in key technical and consulting roles — nearly double the industry average of 15 per cent.

Exit interview data compiled by Varexia's central HR function reveals three consistent themes: bureaucratic decision-making processes that frustrate entrepreneurial talent, lack of meaningful equity participation compared to startup and scale-up competitors, and a perception that the division is a "second-class citizen" within the wider group.

"The best people leave within 18 months," said a former Varexia Digital senior manager who departed last year for a Berlin-based AI startup. "They join expecting to build innovative solutions. Instead, they spend 60 per cent of their time navigating internal approval processes and justifying their existence to a supervisory board that doesn't understand technology."

The talent drain is already impacting financial performance. The division's EBITDA margin has declined from 19.2 per cent in FY2023 to 16.7 per cent in FY2025, largely driven by rising recruitment and retention costs. Premium salaries required to attract replacements are estimated to cost €40-50m annually above market rates.

Industry observers suggest the division faces a structural governance problem. "You cannot run a consulting and digital services business inside a traditional German conglomerate structure," said Prof. Dr. Stefan Richter of WHU Otto Beisheim School of Management. "The incentive systems, the decision-making speed, the culture — everything is misaligned."

Some analysts have suggested that a spin-off or partial IPO of the digital unit could simultaneously solve the talent retention problem — by creating a standalone equity story — and unlock value for Varexia shareholders.`
    },
    {
      id: "n6",
      source: "Financial Times",
      sourceTag: "FT",
      category: "Energy",
      date: "February 7, 2026",
      headline: "European grid operators face €200bn investment gap as energy transition accelerates",
      subheadline: "Varexia's infrastructure arm among groups struggling to balance transition spending with shareholder returns",
      author: "Sophie Müller, Energy Correspondent",
      content: `Europe's energy infrastructure companies face a collective investment gap of approximately €200bn over the next decade as the continent races to modernise its electricity grids for the energy transition, according to a new report by McKinsey & Company.

The analysis highlights the acute tension between the massive capital requirements of grid modernisation and the financial constraints facing diversified groups that house infrastructure assets alongside other businesses.

Varexia SE's Energy & Infrastructure division, which generates €6bn in revenue and employs 29,000 people, is cited as a case study in the report. The division requires sustained capital expenditure of €1.5-2bn annually to meet its grid modernisation commitments, yet operates within a group whose total free cash flow barely covers existing obligations.

"Infrastructure assets need patient, dedicated capital," said the report's lead author. "Housing them inside a diversified conglomerate that also needs to fund retail operations, logistics automation, and digital transformation creates an impossible capital allocation puzzle."

The division's EBITDA margin of 15 per cent is broadly in line with regulated European peers, but the capital intensity of its operations means that free cash flow conversion remains low. The "Transition ambition vs. cash generation" tension identified in Varexia's own strategic documents reflects a wider industry challenge.

Market analysts have noted that standalone European grid operators such as Elia Group and TenneT command significantly higher valuation multiples than Varexia's infrastructure division receives as part of the conglomerate. A separation could potentially unlock €8-10bn of incremental value, though execution risks remain significant.

Varexia declined to comment on the McKinsey report but pointed to its published sustainability targets, which include a commitment to carbon neutrality across its infrastructure operations by 2040.`
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
