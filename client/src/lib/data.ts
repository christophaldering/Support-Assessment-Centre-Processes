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
  ],
  cashFlow: {
    operating: [
      { item: "EBITDA", value: 3.612 },
      { item: "Depreciation & amortization", value: 2.184 },
      { item: "Provisions (pensions, others)", value: 0.248 },
      { item: "Working capital", value: -1.396 },
      { item: "Income taxes paid", value: -0.862 },
      { item: "Net cash from operating activities", value: 3.786, isSubtotal: true }
    ],
    investing: [
      { item: "Capital expenditure (PP&E)", value: -1.482 },
      { item: "Capital expenditure (ROU assets)", value: -0.846 },
      { item: "Proceeds from asset disposals", value: 0.318 },
      { item: "Investments in associates & JVs", value: -0.214 },
      { item: "Net cash from investing activities", value: -2.224, isSubtotal: true }
    ],
    financing: [
      { item: "Net change in financial debt", value: 0.742 },
      { item: "Net change in lease liabilities", value: 0.391 },
      { item: "Dividends paid", value: -0.624 },
      { item: "Interest paid", value: -0.518 },
      { item: "Net cash from financing activities", value: -0.009, isSubtotal: true }
    ],
    cashBridge: [
      { item: "Opening cash balance", value: 5.812 },
      { item: "Net change in cash", value: 1.553 },
      { item: "Closing cash balance", value: 7.365, isSubtotal: true }
    ]
  },
  stressScenario: {
    title: "Cashflow Stress Scenario 2026",
    subtitle: "Liquidity pressure caused by operational shifts, investment timing and working capital dynamics",
    items: [
      { item: "EBITDA (plan)", value: 3.70, comment: "Broadly in line with expectations" },
      { item: "Delta working capital", value: -1.40, comment: "Inventory build-up & delayed receivables" },
      { item: "CAPEX (incl. IFRS 16)", value: -2.30, comment: "Timing shift into H1 2026" },
      { item: "Cash taxes & pensions", value: -0.90, comment: "One-off effects" },
      { item: "Operating Free Cash Flow", value: -0.90, comment: "Negative earlier than planned", isSubtotal: true },
      { item: "Net financing effects", value: 0.40, comment: "Short-term facilities utilized" },
      { item: "Net change in cash", value: -0.50, comment: "Liquidity buffer reduced", isSubtotal: true }
    ],
    keyDrivers: [
      "Faster-than-expected inventory build-up in Retail & Consumer Goods",
      "Service-level stabilization in Logistics increasing short-term costs",
      "Front-loaded CAPEX in Energy & Infrastructure projects",
      "Limited flexibility in lease-related cash outflows"
    ],
    implications: [
      "Net debt / EBITDA temporarily increases above 3.6x",
      "Internal liquidity buffer falls below comfort range",
      "Increased sensitivity to interest rate movements",
      "Rating agencies request additional transparency"
    ]
  },
  analystReport: {
    source: "Northbridge Capital Research",
    title: "External Credit-Style Assessment",
    observations: [
      "Reported EBITDA stability masks a structurally weak cash conversion profile.",
      "Over the past fiscal year, working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.",
      "From an external perspective, the Group's portfolio composition remains challenging to assess. High-volume retail operations, capital-intensive infrastructure assets and a rapidly scaling digital unit coexist without clearly articulated capital allocation thresholds."
    ],
    financialIndicators: [
      { label: "EBITDA", value: "€3.600 bn" },
      { label: "Operating cash flow*", value: "€1.602 bn" },
      { label: "Cash conversion (OCF / EBITDA)", value: "45.5%" },
      { label: "Net CAPEX incl. leases", value: "-€2.328 bn" },
      { label: "Free cash flow", value: "-€0.73 bn" },
      { label: "Net debt / EBITDA", value: "3.3x" }
    ],
    conclusion: "Northbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritization, the current trajectory is unsustainable."
  },
  pulseSurvey: {
    title: "Leadership & Ownership Pulse Survey 2025",
    participants: 320,
    responseRate: 68,
    scale: "1 = strongly disagree | 5 = strongly agree",
    note: "Results reflect perceptions, not intentions",
    sections: [
      {
        name: "Role Clarity & Ownership",
        items: [
          { statement: "I have sufficient decision authority to fulfil my responsibilities.", score: 2.4 },
          { statement: "Accountability and decision rights are aligned in my role.", score: 2.1 },
          { statement: "When priorities conflict, it is clear who decides.", score: 2.3 }
        ]
      },
      {
        name: "Targets & Incentives",
        items: [
          { statement: "My targets encourage collaboration across functions.", score: 2.0 },
          { statement: "I am rewarded for end-to-end outcomes, not just local optimization.", score: 1.9 },
          { statement: "I sometimes act against my own targets to do what I believe is right.", score: 3.2 }
        ]
      },
      {
        name: "Pressure & Sustainability",
        items: [
          { statement: "My workload is sustainable over the next 12 months.", score: 2.2 },
          { statement: "I have enough capacity to focus on improvement, not just firefighting.", score: 1.8 },
          { statement: "I feel comfortable raising concerns early.", score: 2.5 }
        ]
      },
      {
        name: "Trust & Leadership",
        items: [
          { statement: "I trust senior management to consider local realities.", score: 2.6 },
          { statement: "Central decisions are explained in a way I can relate to.", score: 2.3 },
          { statement: "I see a clear and consistent direction for the organization.", score: 2.7 }
        ]
      }
    ],
    comments: [
      "I am accountable for results, but I don't feel empowered to influence the outcome.",
      "We solve problems with personal commitment and overtime - not with structures.",
      "The organization talks about ownership but avoids making ownership explicit."
    ],
    hrComment: "The data indicates a structural tension between responsibility, authority and incentives. This is not a motivation issue. It is a leadership system issue."
  },
  ratingAgencyNotes: {
    title: "Meeting Notes: Exchange with Rating Agency",
    date: "January 26, 2026",
    participants: [
      "Michael Turner (CFO) Varexia Group",
      "Senior Director European Corporates, Rating agency (non-public)"
    ],
    format: "Phone call (informal, approx. 30 minutes)",
    classification: [
      "No formal rating review",
      "No short-term rating action planned",
      "Nevertheless: increased internal attention on Varexia",
      "Increasingly classified in peer comparison (retail/infrastructure/diversified groups)"
    ],
    operativePerformance: [
      "Operating business continues to be assessed as stable",
      "Revenue and EBITDA development generally positive",
      "Portfolio diversification recognized"
    ],
    cashFlowProfile: [
      "Cash conversion (OCF/EBITDA) significantly below historical levels",
      "Deviation from peers increasingly noticeable",
      "Main drivers: Front-loaded CAPEX, Working capital tied up, Scope and inflexibility of the leasing footprint",
      "Individual effects explainable – cumulative effect relevant"
    ],
    capitalAllocation: [
      "Strategic rationale behind individual investments comprehensible",
      "Uncertainty regarding priorities in the event of conflicting objectives",
      "Uncertainty regarding explicit thresholds (e.g., net debt/EBITDA)",
      "Uncertainty regarding conditions for price adjustments"
    ],
    quote: "Not the question of what you do – but under which conditions you would change course.",
    expectations: [
      "No measures in the short term",
      "With cash flow pressure persisting, increasing focus on Net debt/EBITDA development (12–18 months)",
      "Visibility of prioritization",
      "Consistency of internal and external communication",
      "Governance and management quality are becoming increasingly important"
    ],
    internalEvaluation: "No acute escalation. Perception: probationary phase, not crisis. External stakeholders expect clearer trade-offs."
  },
  workshopProtocol: {
    title: "Workshop Protocol – Commercial & Market Alignment",
    date: "January 27, 2026",
    location: "Regional Sales Hub, Cologne",
    context: "Extraordinary workshop following increased customer escalations and recent market signals",
    sections: [
      {
        title: "1. Opening & Shared Understanding",
        content: "The workshop was opened by the Head of Commercial Excellence, who framed the session as a deliberate pause to reflect on growing tensions between market expectations and internal steering mechanisms. Participants were explicitly encouraged to speak openly and without immediate solution pressure.\n\nSeveral participants noted that recent customer escalations should not be seen as isolated incidents, but as signals of a broader shift in market behavior."
      },
      {
        title: "2. Market Observations from the Sales Organisation",
        content: "Sales representatives reported a noticeable change in the tone of customer discussions. Price comparisons with competitors are now raised much earlier in negotiations, often supported by concrete alternative offers.\n\nIn parallel, customers increasingly question delivery reliability and operational flexibility. What had previously been accepted as occasional deviations is now perceived as structural rigidity.\n\n\"We are no longer negotiating from a position of trust. Customers assume alternatives exist and expect us to justify why we are still the right partner.\""
      },
      {
        title: "3. Internal Constraints and Perceived Misalignment",
        content: "A recurring theme was the perceived gap between centrally defined pricing corridors and the realities of customer-facing negotiations. While participants acknowledged the financial rationale behind tighter controls, many expressed concern about their cumulative impact on relationship management.\n\nOperational representatives added that capacity allocation and delivery windows are increasingly optimised for efficiency, leaving limited room for ad-hoc adjustments requested by key accounts.\n\n\"Finance optimises margins quarter by quarter. We manage relationships that span decades.\""
      },
      {
        title: "4. Emerging Tensions and Unresolved Questions",
        content: "The discussion converged on a shared understanding that the organisation is currently operating close to the limits of what customers perceive as acceptable flexibility. Participants disagreed, however, on whether this should be addressed through selective exceptions, a broader adjustment of commercial principles or clearer prioritisation of key accounts.\n\nNo final decisions were taken during the workshop."
      }
    ]
  },
  lessonsLearnedSpeech: {
    title: "Internal Lessons Learned – DRAFT",
    subtitle: "Submitted proposal by Key Account Management Austria",
    sections: [
      {
        heading: "A Short Story to Start",
        content: "Last Tuesday evening, I walked into a store on my way home. Front aisle. Promotion display. The price label was there. The shelf was empty.\n\nA store manager stood next to me, on the phone, explaining to a customer why an advertised product was not available on day two of a national promotion. I did not introduce myself. I just listened.\n\nThat moment was uncomfortable. Not because someone had made a mistake. But because it was painfully obvious that the system had worked exactly as we had designed it to work."
      },
      {
        heading: "What Actually Went Wrong",
        content: "Retail pushed for availability. Logistics pushed for efficiency. IT pushed for stability. Each of us did what our targets told us to do. And each of us was locally right."
      },
      {
        heading: "Why That Was Not Enough",
        content: "Together, we optimized ourselves out of a good overall result. We had no clear end-to-end owner, no shared definition of success, and no early escalation when priorities collided."
      },
      {
        heading: "The Uncomfortable Truth",
        content: "We compensated with overtime, manual fixes and goodwill. That saved the week. It did not fix the system. And it made the next failure more likely, not less."
      },
      {
        heading: "What Must Change",
        content: "If we want different outcomes, we need different ownership, different KPIs and explicit trade-offs. Otherwise, we will repeat this story – with different products, but the same ending."
      }
    ],
    footer: "Internal use / Learning oriented reflection – not a blame statement."
  },
  digitalSteeringCommittee: {
    title: "Digital Steering Committee – Formal Minutes",
    date: "January 25, 2026",
    duration: "90 minutes",
    participants: "Alexandra Rossi (CEO), Michael Turner (CFO), Isabelle Fournier (CIO), Heads of Retail, Logistics, HR",
    agendaItem: "Agenda Item 3 – Integrated Planning & Promotion Platform",
    status: "Amber",
    timeline: "+6 months",
    budgetUtilization: "72%",
    businessCase: "to be refined",
    discussion: "Retail reiterates urgency following recent promotion issues. Logistics emphasizes need for planning stability. IT highlights scope creep and limited development capacity. Finance requests updated ROI and short-term impact. Operations notes general alignment but asks for clearer next steps.",
    decisions: "Agreement to refine scope. Agreement to update business case. Agreement to revisit governance model. (No formal decision taken.)",
    actionItems: "IT to prepare revised roadmap (4 weeks). Business to clarify prioritization criteria (open). Finance to reassess ROI assumptions (open)."
  },
  leadershipWorkshop: {
    title: "Internal Leadership Workshop – Executive One-Page Summary",
    subtitle: "When performance remains strong, but the system shows structural strain",
    date: "January 7, 2026",
    location: "Cologne | On-site",
    format: "Half-day leadership workshop",
    participants: "Executive Board, Business Unit Heads, Regional CEOs",
    objective: "Establish a shared fact base and leadership alignment",
    situationAssessment: [
      "Operating performance remains robust across business units",
      "Cash flow and efficiency targets are increasingly binding",
      "Steering mechanisms show growing internal contradictions",
      "Target conflicts are managed implicitly rather than resolved explicitly"
    ],
    structuralTensions: [
      "Market responsiveness vs. efficiency and cost discipline",
      "Flexibility at the front line vs. system stability and standardization",
      "Accountability for results vs. limited decision authority",
      "Short-term cash discipline vs. service levels and growth ambitions"
    ],
    organizationalResponse: [
      "Increased reliance on managerial discretion and informal decisions",
      "Sustained overtime and personal commitment in critical roles",
      "Selective rule-bending to protect customer and revenue outcomes",
      "Escalations avoided to preserve short-term stability"
    ],
    emergingRisks: [
      "Gradual erosion of leadership clarity and credibility",
      "Rising frustration and cynicism in experienced management layers",
      "Increased vulnerability to external recruitment pressure",
      "Growing dependence on informal workarounds"
    ],
    coreInsight: [
      "The challenge is neither operational nor purely financial",
      "It is a leadership and steering issue at enterprise level",
      "Non-decision has become an implicit decision with material risk",
      "Explicit prioritization is required to restore system coherence"
    ],
    implication: "Without explicit prioritization and clear decision ownership, organizational strain will continue to increase despite strong reported performance."
  },
  leadershipConference: {
    title: "Leadership Conference 2025 – Navigating a More Fragmented World",
    subtitle: "Excerpt from the internal leadership newsletter – December 2025",
    content: `As part of this year's Global Leadership Conference in November, senior leaders from across the Varexia Group came together to reflect on the company's strategic priorities and the broader environment in which we operate.

One of the external highlights of the conference was a keynote delivered by Peter Neumann, senior partner from McKinsey & Company, who provided a concise but thought-provoking perspective on recent shifts in the global economic and political landscape.

In his talk, Peter described how the world is moving away from a broadly rules-based, predictable order towards a more fragmented and multipolar reality. Trade flows, energy markets, technology ecosystems and regulatory regimes, he argued, are increasingly shaped by geopolitical considerations rather than purely economic logic. As a result, volatility and uncertainty are becoming structural features rather than temporary disruptions.

A central message of the keynote was that in a multipolar environment, contradictions cannot simply be optimized away. Efficiency, resilience, flexibility and financial discipline often pull in different directions. Where such tensions used to be manageable through implicit compromises and informal coordination, they now tend to surface more sharply and more frequently.

Several leaders noted in subsequent discussions that this perspective helped them reframe current challenges within the organization. Issues around prioritization, decision authority and the balance between global standards and local responsiveness were no longer seen as isolated internal questions, but as reflections of a more complex external context.

Rather than offering ready-made answers, the keynote served as an invitation to reflect more deeply on how leadership assumptions may need to evolve. In particular, it highlighted the growing importance of making trade-offs explicit and of clearly owning decisions in situations where not all objectives can be achieved simultaneously.

The session was widely appreciated for providing a shared language and reference point that continued to shape conversations throughout the conference – and beyond.`
  },
  boardMeetingImpressions: [
    {
      title: "Discussion regarding Share Price Development (1/3)",
      content: `Varexia's trading division faces a delicate balancing act – cash flow becomes the focus.

Solid operational performance masks growing tensions between investment ambitions and financial discipline.

The trading and infrastructure group Varexia is facing a delicate phase in its strategic cycle. Although its operating business is stable, even relatively minor deviations from the plan are having an increasingly noticeable effect on free cash flow – and are bringing capital allocation more sharply into focus for the Management Board, Supervisory Board, and external observers.

According to information from the company's environment, the timing and scope of investments and changes in working capital have become particularly important in recent months. While sales and margin figures continue to appear robust, liquidity developments are becoming the focus of internal discussions. Rating agencies are not alarmed so far, but are monitoring developments more closely – an indication of increased sensitivity to debt and financing flexibility.

Varexia, whose business areas range from food retail to logistics and energy infrastructure to digital services, generated revenues of around €42 billion in the past fiscal year with stable operating margins. Nevertheless, free cash flow is said to have come under pressure earlier than originally expected. The main drivers are considered to be front-loaded investments, particularly in logistics and energy projects, as well as inventory build-ups in individual business areas.`
    },
    {
      title: "Discussion regarding Strategic Options (2/3)",
      content: `Management points to the resilience of the core business and the Group's broad earnings base. Internally, however, this development has triggered an intense debate about priorities. The central question is how ambitious growth programs can be reconciled with the need for balance sheet discipline and control.

The tension is particularly evident in the classic conflicts of interest faced by large retail groups: Varexia wants to invest in price attractiveness, supply chain stability, and the energy transition at the same time – without letting debt get out of hand. Net debt is still considered high, which is due to the capital-intensive structure of the business model and long-term rental and leasing obligations.

The supervisory board agrees on the problem description, but not on the right course of action. Some members advocate a more defensive approach and clearer prioritization in order to secure financial leeway. Others warn against curbing investment while competitive pressure in key markets is increasing. Too sharp a braking maneuver could weaken the strategic position in the long term.

External observers are also becoming more attentive. Analysts point out that Varexia remains well positioned operationally, but that cash flow transparency is becoming increasingly important. The decisive factor will be whether management succeeds in telling a convincing story—one that combines short-term financial discipline with a credible path to sustainable growth.`
    },
    {
      title: "Discussion regarding Asset Allocation and Governance (3/3)",
      content: `Competition in the European trade and logistics market is intensifying noticeably. According to market observers, major competitors are increasingly resorting to price promotions while simultaneously reviewing their investment programs.

In particular, the balance between growth, service quality, and financial stability is becoming more important. Several industry experts point out that delivery reliability and operational resilience are increasingly proving to be differentiating factors, especially in large-scale retail formats. At the same time, a comparison with competitors shows that the debt levels of some market participants are already at the upper end of the industry spectrum. Although overall profitability remains solid, the ability to finance investments from current cash flow is being questioned more critically.

Other retail groups are already responding by temporarily curbing their investments in order to secure financial leeway. This restraint could increase competitive pressure for those who continue to expand aggressively. Industry experts therefore expect strategic priorities to shift in the coming quarters. The question is less whether to invest, but at what pace – and with what risk.`
    }
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
