export type DocumentType = 'memo' | 'report' | 'email' | 'analysis' | 'survey' | 'briefing' | 'minutes' | 'article';

export type DocumentCategory =
  | 'Company Overview'
  | 'Market & Competition'
  | 'Products & Business Model'
  | 'Financial Performance'
  | 'Operations'
  | 'Internal Perspectives'
  | 'Key Challenges';

export interface DataRoomDocument {
  id: string;
  slug: string;
  title: string;
  category: DocumentCategory;
  type: DocumentType;
  shortDescription: string;
  readingTime: number;
  body: string;
  order: number;
  isImportant: boolean;
}

export const DATA_ROOM_CATEGORIES: DocumentCategory[] = [
  'Company Overview',
  'Market & Competition',
  'Products & Business Model',
  'Financial Performance',
  'Operations',
  'Internal Perspectives',
  'Key Challenges',
];

export const dataRoomDocuments: DataRoomDocument[] = [
  {
    id: 'doc-01',
    slug: 'corporate-profile',
    title: 'Corporate Profile — Varexia SE',
    category: 'Company Overview',
    type: 'report',
    shortDescription: 'Overview of the Varexia Group: structure, scale, market positioning, and dual management model.',
    readingTime: 4,
    order: 1,
    isImportant: true,
    body: `Varexia SE is a publicly listed European stock corporation (Societas Europaea) with a dual management structure comprising an Executive Board and a Supervisory Board.

The Group generates approximately €42.0 billion in annual revenue and employs around 284,000 people across Europe. It operates through four distinct business divisions:

• Retail & Consumer Goods — The largest division with €24.5 billion revenue and 190,000 employees. Operates across multiple retail formats with established brand recognition and customer loyalty in key European markets.

• Logistics & Supply Chain — €8.0 billion revenue, 55,000 employees. Provides integrated logistics services including warehousing, transportation, and last-mile delivery.

• Energy & Infrastructure — €6.5 billion revenue, 25,000 employees. Manages long-term energy and infrastructure assets with contracted revenue streams.

• Digital Services & Consulting — €3.0 billion revenue, 15,000 employees. Offers technology consulting, digital transformation, and managed services.

The company is listed on major European exchanges with a current market capitalisation of approximately €28.7 billion, down from €38.2 billion eighteen months ago. The share price currently stands at €38.40, having declined approximately 18% since December.

Varexia's governance structure follows the German two-tier board model. The Supervisory Board, chaired by Dr. Thomas Berner (also referenced as Jean-Marc Lefèvre in certain communications), provides strategic oversight. The Executive Board, led by CEO Alexandra Rossi, is responsible for operational management.`,
  },
  {
    id: 'doc-02',
    slug: 'organisational-chart',
    title: 'Group Management Team & Organisational Overview',
    category: 'Company Overview',
    type: 'memo',
    shortDescription: 'Key members of the executive team and their divisional responsibilities.',
    readingTime: 3,
    order: 2,
    isImportant: false,
    body: `Executive Board & Senior Leadership

• Alexandra Rossi — Chief Executive Officer (CEO)
• Marcus Weber / Michael Turner — Chief Financial Officer (CFO)
• Isabelle Fournier — Chief Information Officer (CIO)
• Sarah Jenkins — Head of Human Resources
• Emily Watson — Head of Investor Relations

Divisional Leadership

• Lars Nielsen — CEO, Logistics & Supply Chain Division
• Anna Keller — Regional Operations Manager, Retail West
• Thomas Berger — Head of Logistics, Region West
• Julia Meier — Finance Business Partner, Retail
• Claire Dubois — HR Business Partner, Region West

Supervisory Board

• Dr. Thomas Berner / Jean-Marc Lefèvre — Chairman

The organisation operates with a matrix structure where divisional P&L responsibility intersects with functional oversight (Finance, HR, IT). Regional management teams hold operational accountability but report through both divisional and functional lines.

The appointment of a new Chief Strategy Officer (CSO) is currently under consideration — a role intended to provide clearer portfolio-level strategic coordination across the four business divisions.`,
  },
  {
    id: 'doc-03',
    slug: 'strategic-mandate',
    title: 'Strategic Review Mandate from the Supervisory Board',
    category: 'Company Overview',
    type: 'memo',
    shortDescription: 'The Chairman\'s mandate for a comprehensive strategic review, outlining key priorities and expectations.',
    readingTime: 4,
    order: 3,
    isImportant: true,
    body: `From: Dr. Thomas Berner, Chairman of the Supervisory Board
Date: February 14, 2026

The Supervisory Board is requesting a comprehensive strategic review of the Varexia Group. The review should address the following critical issues:

1. Retail & Consumer Goods Profitability
The largest division is underperforming on margins despite stable revenue growth. The tension between price leadership and profitability requires resolution.

2. Digital Services & Consulting Viability
Questions around whether this unit belongs in the portfolio given talent retention challenges and strategic fit. The 28% attrition rate in key technology roles is eroding the unit's value proposition.

3. Capital Allocation Conflicts Between Divisions
Particularly between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation needs. The absence of explicit capital allocation thresholds is creating strategic ambiguity.

The Supervisory Board expects a clear, actionable turnaround strategy that can be presented to the full Board. The analysis should demonstrate strategic depth, financial acumen, and the ability to make difficult trade-offs under uncertainty.

Context: Varexia's market capitalisation has declined from €38.2 billion to €28.7 billion over the past 18 months, reflecting growing investor concern about the Group's strategic direction and operational performance.`,
  },
  {
    id: 'doc-04',
    slug: 'leadership-conference-keynote',
    title: 'Global Leadership Conference — Keynote Summary',
    category: 'Company Overview',
    type: 'report',
    shortDescription: 'Summary of the McKinsey keynote on navigating a multipolar world, and its implications for Varexia\'s leadership.',
    readingTime: 4,
    order: 4,
    isImportant: false,
    body: `Navigating a More Fragmented World

Excerpt from the internal leadership newsletter — December 2025

As part of this year's Global Leadership Conference in November, senior leaders from across the Varexia Group came together to reflect on the company's strategic priorities and the broader environment in which we operate.

One of the external highlights of the conference was a keynote delivered by Peter Neumann, senior partner from McKinsey & Company, who provided a concise but thought-provoking perspective on recent shifts in the global economic and political landscape.

In his talk, Peter described how the world is moving away from a broadly rules-based, predictable order towards a more fragmented and multipolar reality. Trade flows, energy markets, technology ecosystems and regulatory regimes, he argued, are increasingly shaped by geopolitical considerations rather than purely economic logic. As a result, volatility and uncertainty are becoming structural features rather than temporary disruptions.

While the presentation deliberately avoided political assessments, it resonated strongly with many participants because of its implications for leadership and decision-making in large organisations.

A central message of the keynote was that in a multipolar environment, contradictions cannot simply be optimised away. Efficiency, resilience, flexibility and financial discipline often pull in different directions. Where such tensions used to be manageable through implicit compromises and informal coordination, they now tend to surface more sharply and more frequently.

Several leaders noted in subsequent discussions that this perspective helped them reframe current challenges within the organisation. Issues around prioritisation, decision authority and the balance between global standards and local responsiveness were no longer seen as isolated internal questions, but as reflections of a more complex external context.`,
  },
  {
    id: 'doc-05',
    slug: 'berenberg-downgrade',
    title: 'Analyst Downgrade — Berenberg Research Note',
    category: 'Market & Competition',
    type: 'article',
    shortDescription: 'Berenberg downgrades Varexia from Buy to Hold, citing capital allocation concerns and rising net debt.',
    readingTime: 4,
    order: 5,
    isImportant: true,
    body: `Source: Financial Times Markets | February 2026

Berenberg has downgraded Varexia SE from 'Buy' to 'Hold', citing growing concerns over the conglomerate's capital allocation framework and rising net debt levels. The target price was lowered from €52 to €41, reflecting what the bank's analysts describe as "an increasingly uncertain risk-reward profile."

In a research note published on Monday, lead analyst Katharina Voß wrote: "Varexia continues to deliver acceptable operating performance, but the gap between reported earnings and actual cash generation is widening. We see limited catalysts for a re-rating until management provides greater transparency on portfolio priorities and covenant headroom."

The downgrade follows a series of meetings with institutional investors, many of whom expressed frustration with the company's unwillingness to explicitly rank its four business divisions by strategic priority. "The market can tolerate complexity," one fund manager was quoted as saying. "What it cannot tolerate is ambiguity about what management would sacrifice if conditions deteriorate."

Varexia's shares fell 3.2% on the day of the downgrade, closing at €37.10. The stock has underperformed the STOXX Europe 600 by approximately 22% over the past twelve months.

The company declined to comment on the specific analyst rating but reiterated its commitment to "disciplined capital allocation and long-term value creation across all business segments."`,
  },
  {
    id: 'doc-06',
    slug: 'activist-investor-pressure',
    title: 'Board Tensions & Activist Investor Activity — Press Summary',
    category: 'Market & Competition',
    type: 'article',
    shortDescription: 'Handelsblatt analysis of governance pressures at European conglomerates, with specific focus on Varexia.',
    readingTime: 5,
    order: 6,
    isImportant: true,
    body: `Source: Handelsblatt | February 2026

A growing number of European conglomerates are facing pressure to simplify their portfolios and sharpen strategic focus, as activist investors and long-only shareholders alike demand greater accountability from boards.

Among the companies under scrutiny is Varexia SE, the €42 billion revenue group whose business spans retail, logistics, energy infrastructure, and digital consulting. While the company has not been publicly targeted by an activist fund, market sources indicate that at least two value-oriented investors have been building positions in recent months.

"The classic European conglomerate model is being tested," says Prof. Dr. Heinrich Meier, chair of corporate governance at WHU. "Boards that cannot articulate a clear portfolio logic will face increasing pressure."

Within Varexia, sources close to the Supervisory Board suggest that tensions have emerged between members who favour a more conservative financial stance and those who support continued investment in growth initiatives. The appointment of a new Chief Strategy Officer is seen as a potential turning point.

Industry observers note that the Energy and Infrastructure division, while generating attractive margins of 11.5%, ties up significant capital and operates on investment cycles that are fundamentally different from the Retail business. The Digital Services unit, meanwhile, faces talent retention challenges that some board members view as structurally incompatible with a traditional conglomerate model.

"The question is not whether Varexia has good businesses," a senior banker familiar with the group commented. "The question is whether they are better together or apart."`,
  },
  {
    id: 'doc-07',
    slug: 'retail-sector-outlook',
    title: 'European Retail Sector Outlook — Goldman Sachs Review',
    category: 'Market & Competition',
    type: 'analysis',
    shortDescription: 'Goldman Sachs sector analysis highlighting margin pressure, consumer confidence, and covenant risk for diversified retailers.',
    readingTime: 4,
    order: 7,
    isImportant: false,
    body: `Source: Reuters Business | January 2026

European retail groups face a challenging year ahead as consumer confidence indices across the eurozone continue to soften, according to a comprehensive sector review published by Goldman Sachs.

The report highlights three structural challenges: persistent input cost inflation that cannot be fully passed on to consumers, intensifying competition from discount formats and online platforms, and rising financing costs that constrain investment capacity.

For diversified groups like Varexia SE, Ahold Delhaize, and Carrefour, the pressure is compounded by the need to balance multiple business priorities simultaneously. "Multi-format operators face a unique challenge," the report notes. "They must defend market share in price-sensitive segments while investing in premium experiences and digital capabilities."

The Goldman Sachs analysis assigns Varexia a "Neutral" rating, noting that while the company's operating performance remains resilient, its free cash flow profile and leverage trajectory warrant monitoring. The report specifically flags the risk of covenant pressure should EBITDA margins compress by more than 50 basis points from current levels.

Consumer confidence in Germany, Varexia's largest market, declined for the third consecutive month in January. Households continue to prioritise savings over discretionary spending, a trend that disproportionately affects large-format retailers.

Market participants expect further consolidation in the sector, with financially constrained players potentially becoming acquisition targets rather than acquirers.`,
  },
  {
    id: 'doc-08',
    slug: 'analyst-clarification-request',
    title: 'Analyst Inquiry — Financial Flexibility Clarification',
    category: 'Market & Competition',
    type: 'email',
    shortDescription: 'External analyst request for clarification on leverage trajectory, investment flexibility, and dividend policy.',
    readingTime: 3,
    order: 8,
    isImportant: false,
    body: `From: Peter Kennen, Senior Analyst — European Consumer & Infrastructure
To: Investor Relations
Date: January 23, 2026

Following the recent market discussions around capital allocation and balance sheet resilience in the European retail and infrastructure sector, we would appreciate further clarification on the Group's current financial flexibility.

While the FY 2025 results demonstrate solid operating performance, investors have noted the combination of elevated leverage, front-loaded capital expenditure and working capital volatility. In particular, questions have been raised as to how sensitive free cash flow generation is to moderate deviations from plan.

Against this backdrop, could you please comment on:

• the expected trajectory of net debt / EBITDA over the next 12–24 months;
• the degree of flexibility embedded in the current investment programme;
• and the implications for dividend policy should cashflow pressure persist.

We are asking these questions in the context of an upcoming sector note and would value your perspective to ensure an accurate representation of the Group's financial positioning.`,
  },
  {
    id: 'doc-09',
    slug: 'investor-relations-update',
    title: 'Market Update — Share Price & Analyst Feedback',
    category: 'Market & Competition',
    type: 'memo',
    shortDescription: 'Internal IR briefing on share price performance, investor sentiment, and analyst positioning.',
    readingTime: 3,
    order: 9,
    isImportant: false,
    body: `From: Emily Watson, Head of Investor Relations
To: Executive Board
Date: January 15, 2026

Here is a brief market update to help you understand the current external perception:

• The Varexia Group's share price is currently €38.40.
• Since the beginning of December, this represents a decline of around 18%.
• Increased volatility has been observed over the last six weeks, with no clear individual drivers.

Feedback from discussions with investors and sell-side analysts indicates that the focus is less on operating performance and more on cash flow development, the pace of investment, and prioritisation.

Short excerpt from analyst call (IR summary):

"We don't see a crisis, but we also don't see clear prioritisation. The question is less what Varexia is doing and more when the company is prepared to adjust course if cash flow and capital commitment do not improve."

There are currently no acute ad hoc events. Nevertheless, further developments are being closely monitored.`,
  },
  {
    id: 'doc-10',
    slug: 'business-unit-overview',
    title: 'Business Unit Performance Summary FY 2025',
    category: 'Products & Business Model',
    type: 'report',
    shortDescription: 'Comparative overview of all four business divisions: revenue, margins, employees, and key tensions.',
    readingTime: 5,
    order: 10,
    isImportant: true,
    body: `Varexia SE — Divisional Performance Overview (FY 2025)

1. Retail & Consumer Goods
• Revenue: €24.5 bn (prior year: €23.82 bn, +2.9%)
• EBITDA: €1.8 bn (prior year: €1.65 bn, +9.1%)
• EBITDA Margin: 7.3%
• Employees: 190,000
• Key Tension: Price leadership vs. profitability
• KPIs: Like-for-like sales, Gross margin, Working capital
• Assessment: Revenue growth stable but margin remains below industry leaders. The division generates the majority of Group cash flow but faces pressure from discount competitors and consumer confidence weakness.

2. Logistics & Supply Chain
• Revenue: €8.0 bn (prior year: €7.6 bn, +5.3%)
• EBITDA: €0.55 bn (prior year: €0.7 bn, -21.4%)
• EBITDA Margin: 6.9%
• Employees: 55,000
• Key Tension: Speed & reliability vs. cost efficiency
• KPIs: Service level (OTIF), Cost per case/delivery, Warehouse utilisation
• Assessment: Revenue growing but EBITDA declining significantly. 40% of operations remain semi-manual. Automation investment urgently needed but constrained by Group CAPEX freeze discussions.

3. Energy & Infrastructure
• Revenue: €6.5 bn (prior year: €6.2 bn, +4.8%)
• EBITDA: €0.75 bn (stable)
• EBITDA Margin: 11.5%
• Employees: 25,000
• Key Tension: Long-term assets vs. short-term returns
• KPIs: CAPEX intensity, ROI/IRR (portfolio), Regulatory compliance risk
• Assessment: Highest margins in the Group with stable, long-term contracted revenues. However, the capital-intensive nature creates tension with other divisions' funding needs. Investment cycles fundamentally different from Retail.

4. Digital Services & Consulting
• Revenue: €3.0 bn (prior year: €2.7 bn, +11.1%)
• EBITDA: €0.5 bn (prior year: €0.43 bn, +16.3%)
• EBITDA Margin: 16.7%
• Employees: 15,000
• Key Tension: Scalability vs. people dependency
• KPIs: Utilisation rate, Project margin, Talent retention (key roles)
• Assessment: Highest growth and margins, but facing 28% attrition in key technology roles. Strategic fit within the conglomerate model is increasingly questioned.

Group Totals
• Revenue: €42.0 bn
• EBITDA: €3.6 bn
• Employees: ~284,000`,
  },
  {
    id: 'doc-11',
    slug: 'digital-talent-crisis',
    title: 'Talent Retention Crisis — Digital Services Division',
    category: 'Products & Business Model',
    type: 'memo',
    shortDescription: 'HR alert on 28% attrition in Digital Services, with analysis of root causes and strategic implications.',
    readingTime: 3,
    order: 11,
    isImportant: true,
    body: `From: Sarah Jenkins, Head of HR
Date: February 14, 2026

Urgent people issue in the Digital Services & Consulting division.

Current Situation:
We are experiencing 28% attrition in key technology roles over the past 12 months. Exit interviews consistently cite the same reasons: Varexia is perceived as too bureaucratic, and employees lack the equity upside they could get at startups or pure-play tech companies.

Financial Impact:
The division's margin of 16.7% looks healthy on paper, but it is trending downward due to the premium salaries we must pay to attract and retain top talent. We are in a vicious cycle — we pay more to retain people, which compresses margins, which makes the business case for the unit harder to justify.

Strategic Options:
My recommendation is that we either:

a) Fundamentally fix the governance and incentive structure for Digital Services — potentially including a carve-out with equity participation — or

b) Make the difficult decision to wind down or divest the unit before the talent drain destroys its value entirely.

Assessment:
This is not a cyclical problem. It is structural. The conglomerate model is inherently disadvantaged in competing for top technology talent against purpose-built technology companies with equity-based compensation models.`,
  },
  {
    id: 'doc-12',
    slug: 'logistics-investment-request',
    title: 'Logistics Automation — Investment Case & CAPEX Request',
    category: 'Products & Business Model',
    type: 'memo',
    shortDescription: 'Logistics division CEO\'s urgent request to protect automation CAPEX amid Group-wide freeze discussions.',
    readingTime: 3,
    order: 12,
    isImportant: false,
    body: `From: Lars Nielsen, CEO Logistics Division
Date: February 14, 2026

Regarding the rumours of a CAPEX freeze across the Group:

If our logistics automation investment is cut, we will see an estimated 15% rise in cost per case within 12 months. Our competitors are actively automating their supply chains, and we cannot afford to fall further behind.

Currently, 40% of our operations remain semi-manual. The tension between Speed and Cost is breaking us — we are being asked to deliver faster and more reliably while simultaneously cutting costs. This is not sustainable without investment in automation and digital infrastructure.

I urgently need support from the Executive Board to protect the Logistics division's capital budget. Without it, we risk losing our competitive position in a market where efficiency is the primary differentiator.

Key Data Points:
• 40% of operations semi-manual
• Competitors actively automating
• 15% cost increase projected if investment deferred
• Service level (OTIF) at risk of decline
• Revenue: €8.0 bn, EBITDA declining from €0.7 bn to €0.55 bn year-over-year`,
  },
  {
    id: 'doc-13',
    slug: 'cfo-financial-briefing',
    title: 'CFO Briefing — Financial Situation & Covenant Risk',
    category: 'Financial Performance',
    type: 'memo',
    shortDescription: 'Confidential CFO briefing on profitability erosion, cash flow pressure, and potential debt covenant breach.',
    readingTime: 4,
    order: 13,
    isImportant: true,
    body: `From: Marcus Weber, CFO
Date: February 14, 2026
Classification: CONFIDENTIAL

Revenue has remained stable at €42.0 billion, but profitability is eroding. Group EBIT stands at €1.4 billion, which represents a concerning decline in margins across several business units.

Free cash flow is barely covering our dividend commitments and essential capital expenditure. The tension between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation capacity is becoming unsustainable.

Covenant Risk:
Most critically, we are approaching a potential debt covenant breach. Our total debt stands at €11.4 billion in bonds plus €9.6 billion in bank loans. The covenant ratios are tightening, and without corrective action, we risk triggering breach clauses within the next 12–18 months.

Required Actions:
We need a strategy that:
• Releases cash
• Improves profitability
• Creates a sustainable capital structure

Any portfolio decisions must account for the covenant implications.`,
  },
  {
    id: 'doc-14',
    slug: 'northbridge-credit-assessment',
    title: 'External Credit Assessment — Northbridge Capital Research',
    category: 'Financial Performance',
    type: 'analysis',
    shortDescription: 'Independent credit analysis highlighting cash conversion weakness, leverage concerns, and portfolio opacity.',
    readingTime: 4,
    order: 14,
    isImportant: true,
    body: `Source: Northbridge Capital Research

Key Financial Indicators:
• EBITDA: €3.600 bn
• Operating cash flow: €1.602 bn
• Cash conversion (OCF / EBITDA): 45.5%
• Net CAPEX incl. leases: -€2.328 bn
• Free cash flow: -€0.73 bn
• Net debt / EBITDA: 3.3x

Observations:
1. Reported EBITDA stability masks a structurally weak cash conversion profile.
2. Over the past fiscal year, working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.
3. From an external perspective, the Group's portfolio composition remains challenging to assess. High-volume retail operations, capital-intensive infrastructure assets and a rapidly scaling digital unit coexist without clearly articulated capital allocation thresholds.

Critical Question:
How resilient is the current investment trajectory should free cash flow remain negative for another investment cycle?

Conclusion:
Northbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritisation, the current trajectory may limit strategic optionality.`,
  },
  {
    id: 'doc-15',
    slug: 'liquidity-stabilisation-plan',
    title: 'Proposed Liquidity Stabilisation & Capital Allocation Measures',
    category: 'Financial Performance',
    type: 'memo',
    shortDescription: 'CFO proposal for sequenced measures: liquidity stabilisation, balance sheet resilience, and strategic ring-fencing.',
    readingTime: 4,
    order: 15,
    isImportant: true,
    body: `From: Michael Turner, Chief Financial Officer
To: Members of the Supervisory Board
CC: Alexandra Rossi (CEO); Group Executive Committee
Date: January 27, 2026

The Group remains operationally sound. At the same time, we are experiencing short-term liquidity pressure combined with an elevated leverage profile. While none of these factors is critical in isolation, their combination requires a coordinated and transparent response.

Management proposes a sequenced set of measures:

Phase 1 — Immediate Liquidity Stabilisation
• Tighter working capital controls
• Postponement of non-critical capital expenditure (~€0.6 bn)
• Securing additional short-term credit lines

Phase 2 — Balance Sheet Resilience
• Selective asset disposals in the range of €0.8–1.2 bn
• Lease renegotiations where feasible
• Increased dividend flexibility
• Target: Move net debt/EBITDA towards ~3.0x

Phase 3 — Strategic Ring-Fencing
• Key growth and digital projects ring-fenced
• Clear stop-go criteria applied
• KPI monitoring enhanced

This approach does not eliminate trade-offs. It does, however, make them explicit, manageable and transparent for all stakeholders.`,
  },
  {
    id: 'doc-16',
    slug: 'cfo-candid-assessment',
    title: 'CFO Personal Assessment — External Perception Risk',
    category: 'Financial Performance',
    type: 'email',
    shortDescription: 'Unusually candid CFO communication to the Supervisory Board about perception gaps and prioritisation needs.',
    readingTime: 4,
    order: 16,
    isImportant: false,
    body: `From: Michael Turner, Chief Financial Officer
To: Members of the Supervisory Board
CC: Alexandra Rossi (CEO); Group Executive Committee
Date: January 27, 2026

I am sharing this note with a degree of personal candour that may feel unusual for a CFO communication. However, given the increasing external attention on our financial profile, I believe transparency at this stage is not only appropriate but necessary.

Earlier this week, we received an external credit-style assessment from Northbridge Capital Research. While the document is not public and has no immediate contractual consequences, its content reflects questions that are beginning to surface more broadly among banks and other capital providers.

The core message is not one of alarm, but of tension: our operating performance remains solid, yet cash generation is currently lagging behind reported earnings. This gap is largely explainable — front-loaded capital expenditure, working capital absorption and the scale of our leasing footprint — but it is also becoming harder to communicate convincingly without a clearer prioritisation narrative.

What gives me pause, personally, is not the numbers themselves. It is the perception that our portfolio logic and capital allocation principles may appear opaque from the outside. Even if we internally understand the trade-offs well, external stakeholders are increasingly asking how long the current balance can be maintained without constraining flexibility.

I do not believe we are facing a liquidity issue. I do believe, however, that we are approaching a point where we need to be more explicit — with ourselves and with others — about what takes precedence if conditions tighten.`,
  },
  {
    id: 'doc-17',
    slug: 'rating-agency-exchange',
    title: 'Rating Agency Meeting Notes — Informal Exchange',
    category: 'Financial Performance',
    type: 'minutes',
    shortDescription: 'Notes from informal call between CFO and senior rating agency director on Varexia\'s credit profile.',
    readingTime: 4,
    order: 17,
    isImportant: false,
    body: `Meeting Notes: Exchange with Rating Agency
Date: January 26, 2026
Participants: Michael Turner (CFO), Senior Director European Corporates (Rating agency)
Format: Phone call (informal, approx. 30 minutes)

Classification by the Rating Agency
• No formal rating review
• No short-term rating action planned
• Nevertheless: increased internal attention on Varexia
• Increasingly classified in peer comparison (retail/infrastructure/diversified groups)

Operative Performance
• Operating business continues to be assessed as stable
• Revenue and EBITDA development generally positive
• Portfolio diversification recognised

Cash Flow & Financial Profile
• Cash conversion (OCF/EBITDA) significantly below historical levels
• Deviation from peers increasingly noticeable
• Main drivers from the rating agency's perspective:
  — Front-loaded CAPEX
  — Working capital tied up
  — Scope and inflexibility of the leasing footprint
  — Individual effects explainable – cumulative effect relevant

Capital Allocation & Governance (External Perception)
• Strategic rationale behind individual investments comprehensible
• Uncertainty regarding:
  — Priorities in the event of conflicting objectives
  — Explicit thresholds (e.g., net debt/EBITDA)
  — Conditions for price adjustments
• Key quote: "Not the question of what you do – but under which conditions you would change course."

Expectations (Implicit)
• No measures in the short term
• With cash flow pressure persisting, increasing focus on:
  — Net debt/EBITDA development (12–18 months)
  — Visibility of prioritisation
  — Consistency of internal and external communication

Internal Evaluation:
• No acute escalation
• Perception: probationary phase, not crisis
• External stakeholders expect clearer prioritisation and consistent communication`,
  },
  {
    id: 'doc-18',
    slug: 'delivery-disruption-incident',
    title: 'Operational Incident — Hub Failure & Delivery Prioritisation',
    category: 'Operations',
    type: 'email',
    shortDescription: 'Real-time email chain revealing cross-functional conflict during a logistics hub failure affecting retail promotions.',
    readingTime: 4,
    order: 18,
    isImportant: false,
    body: `Email Thread: Delivery Prioritisation — February 2026

--- Message 1 ---
From: Anna Keller, Regional Operations Manager Retail West
To: Thomas Berger, Head of Logistics Region West
CC: Finance BP Retail, Regional Management
Date: January 17, 2026, 07:30 AM

Due to the hub failure in Dortmund, around 30% of our planned transport capacity will not be available for the next two days.

The following are critical for retail:
• The ongoing weekend promotion in the Cologne/Düsseldorf metropolitan areas
• Several key accounts with confirmed delivery windows

I need a clear statement today as to which stores we can prioritise. Without targeted prioritisation, we risk customer escalations.

--- Message 2 ---
From: Julia Meier, Finance BP Retail
To: Thomas Berger; Anna Keller
CC: Regional Management
Date: January 17, 2026, 09:15 AM

For reference:
• Option A: approx. €180,000 in additional costs, risk of negative margins in individual regions
• Option B: approx. €90,000 in additional costs, lower individual risks

From a financial perspective, there is no approved exception for unplanned additional costs of this magnitude. Please provide a clear justification for your decision.

--- Analysis ---
This incident illustrates the recurring tension between operational responsiveness and financial control. Decision authority is unclear, cost accountability is fragmented, and regional management is left to make trade-off decisions without explicit mandate or escalation framework.`,
  },
  {
    id: 'doc-19',
    slug: 'workforce-pressure-alert',
    title: 'HR Alert — Sustained Workforce Pressure in Operations',
    category: 'Operations',
    type: 'memo',
    shortDescription: 'HR Business Partner warning on overtime, sick leave, and compliance risks in logistics and retail operations.',
    readingTime: 3,
    order: 19,
    isImportant: false,
    body: `From: Claire Dubois, HR Business Partner Region West
To: Regional Management Retail & Logistics West
CC: Operations Management, HR Management
Date: January 19, 2026

In the course of ongoing promotional and special transport operations, we are observing a sustained high workload in the logistics and retail operating units.

Particularly noticeable are:
• Repeated overtime over several weeks
• Increasing sick leave in individual shifts
• Growing informal arrangements between teams to maintain service levels
• Delayed onboarding of temporary staff due to administrative bottlenecks

While the immediate operational impact has been managed through the personal commitment of experienced team leaders, the pattern raises concerns about medium-term sustainability and compliance with working time regulations.

Several team leaders have informally communicated that they feel caught between operational expectations and workforce well-being obligations. This creates a leadership dilemma that cannot be resolved at the regional level alone.

Recommendation:
A structured review of staffing adequacy and workload distribution should be initiated before the next peak period. The current approach of relying on individual discretion and informal flexibility is not sustainable as a permanent operating model.`,
  },
  {
    id: 'doc-20',
    slug: 'commercial-alignment-workshop',
    title: 'Workshop Protocol — Commercial & Market Alignment',
    category: 'Operations',
    type: 'minutes',
    shortDescription: 'Sales workshop revealing market perception shifts, pricing tensions, and the growing gap between central controls and frontline realities.',
    readingTime: 5,
    order: 20,
    isImportant: false,
    body: `Workshop Protocol — Commercial & Market Alignment
Date: January 27, 2026
Location: Regional Sales Hub, Cologne

1. Opening & Shared Understanding

The workshop was opened by the Head of Commercial Excellence, who framed the session as a deliberate pause to reflect on growing tensions between market expectations and internal steering mechanisms. Participants were explicitly encouraged to speak openly and without immediate solution pressure.

Several participants noted that recent customer escalations should not be seen as isolated incidents, but as signals of a broader shift in market behaviour.

2. Market Observations from the Sales Organisation

Sales representatives reported a noticeable change in the tone of customer discussions. Price comparisons with competitors are now raised much earlier in negotiations, often supported by concrete alternative offers.

In parallel, customers increasingly question delivery reliability and operational flexibility. What had previously been accepted as occasional deviations is now perceived as structural rigidity.

One participant summarised this sentiment:
"We are no longer negotiating from a position of trust. Customers assume alternatives exist and expect us to justify why we are still the right partner."

3. Internal Constraints and Perceived Misalignment

A recurring theme was the perceived gap between centrally defined pricing corridors and the realities of customer-facing negotiations. While participants acknowledged the financial rationale behind tighter controls, many expressed concern about their cumulative impact on relationship management.

Operational representatives added that capacity allocation and delivery windows are increasingly optimised for efficiency, leaving limited room for ad-hoc adjustments requested by key accounts.

"Finance optimises margins quarterly. Sales lives with consequences daily."`,
  },
  {
    id: 'doc-21',
    slug: 'digital-steering-committee',
    title: 'Digital Steering Committee — Formal Minutes',
    category: 'Operations',
    type: 'minutes',
    shortDescription: 'Committee minutes revealing scope creep, timeline delays, and governance ambiguity in the Integrated Planning Platform project.',
    readingTime: 3,
    order: 21,
    isImportant: false,
    body: `Digital Steering Committee — Formal Minutes
Date: January 25, 2026
Participants: Alexandra Rossi (CEO), Michael Turner (CFO), Isabelle Fournier (CIO), Heads of Retail, Logistics, HR

Agenda Item 3 — Integrated Planning & Promotion Platform

Status: Amber | Timeline: +6 months | Budget utilisation: 72% | Business case: to be refined

Discussion (Excerpt):
• Retail reiterates urgency following recent promotion issues
• Logistics emphasises need for planning stability
• IT highlights scope creep and limited development capacity
• Finance requests updated ROI and short-term impact
• Operations notes general alignment but asks for clearer next steps

Decisions:
• Agreement to refine scope
• Agreement to update business case
• Agreement to revisit governance model
• (No formal decision taken.)

Action Items:
• IT to prepare revised roadmap (4 weeks)
• Business to clarify prioritisation criteria (open)
• Finance to reassess ROI assumptions (open)

Assessment:
This set of minutes illustrates a recurring governance pattern: broad agreement on the need for action, but no binding decisions, no clear ownership, and no explicit trade-offs. The platform remains in strategic limbo — too important to cancel, too unfocused to deliver.`,
  },
  {
    id: 'doc-22',
    slug: 'hr-pulse-survey',
    title: 'Leadership & Ownership Pulse Survey 2025 — Results',
    category: 'Internal Perspectives',
    type: 'survey',
    shortDescription: 'Internal survey results revealing structural tensions between responsibility, authority, and incentive alignment.',
    readingTime: 5,
    order: 22,
    isImportant: true,
    body: `Leadership & Ownership Pulse Survey 2025

Survey Parameters:
• Participants invited: 320
• Response rate: 68%
• Scale: 1 (strongly disagree) to 5 (strongly agree)

Category 1: Role Clarity & Ownership
• "I have sufficient decision authority to fulfil my responsibilities." — 2.4
• "Accountability and decision rights are aligned in my role." — 2.1
• "When priorities conflict, it is clear who decides." — 2.3

Category 2: Targets & Incentives
• "My targets encourage collaboration across functions." — 2.0
• "I am rewarded for end-to-end outcomes, not just local optimisation." — 1.9
• "I sometimes act against my own targets to do what I believe is right." — 3.2

Category 3: Pressure & Sustainability
• "My workload is sustainable over the next 12 months." — 2.2
• "I have enough capacity to focus on improvement, not just firefighting." — 1.8
• "I feel comfortable raising concerns early." — 2.5

Category 4: Trust & Leadership
• "I trust senior management to consider local realities." — 2.6
• "Central decisions are explained in a way I can relate to." — 2.3
• "I see a clear and consistent direction for the organisation." — 2.7

Selected Open Comments:
• "I am accountable for results, but I don't feel empowered to influence the outcome."
• "We solve problems with personal commitment and overtime — not with structures."
• "The organisation talks about ownership but avoids making ownership explicit."

HR Commentary:
The data indicates a structural tension between responsibility, authority and incentives. This is not a motivation issue. It is a leadership system issue.`,
  },
  {
    id: 'doc-23',
    slug: 'internal-reflection-speech',
    title: 'Internal Reflection — "What Actually Went Wrong"',
    category: 'Internal Perspectives',
    type: 'memo',
    shortDescription: 'Draft internal speech candidly reflecting on systemic failures behind a promotion logistics incident.',
    readingTime: 4,
    order: 23,
    isImportant: false,
    body: `Internal Reflection Speech — DRAFT
Date: January 2026
Context: Key Account Management Austria

A short story to start

Last Tuesday evening, I walked into a store on my way home. Front aisle. Promotion display. The price label was there. The shelf was empty. A store manager stood next to me, on the phone, explaining to a customer why an advertised product was not available on day two of a national promotion.

I did not introduce myself. I just listened. That moment was uncomfortable. Not because someone had made a mistake. But because it was painfully obvious that the system had worked exactly as we had designed it to work.

What actually went wrong

Retail pushed for availability. Logistics pushed for efficiency. IT pushed for stability. Each of us did what our targets told us to do. And each of us was locally right.

Why that was not enough

Together, we optimised ourselves out of a good overall result. We had no clear end-to-end owner, no shared definition of success, and no early escalation when priorities collided.

The uncomfortable truth

We compensated with overtime, manual fixes and goodwill. That saved the week. It did not fix the system. And it made the next failure more likely, not less.

What must change

If we want different outcomes, we need different ownership, different KPIs and explicit trade-offs. Otherwise, we will repeat this story — with different products, but the same ending.

Classification: Internal use / Learning-oriented reflection — not a blame statement.`,
  },
  {
    id: 'doc-24',
    slug: 'supervisory-board-response',
    title: 'Supervisory Board Response — Priorities & Thresholds',
    category: 'Internal Perspectives',
    type: 'email',
    shortDescription: 'Supervisory Board Chairman\'s response requesting explicit thresholds, communication strategy, and strategic triage criteria.',
    readingTime: 4,
    order: 24,
    isImportant: true,
    body: `From: Jean-Marc Lefèvre, Chair of the Supervisory Board
To: Michael Turner (CFO)
Date: January 18, 2026

Dear Michael,

Thank you for the outline of the proposed measures in response to the recent cashflow developments. The Supervisory Board appreciates the clarity of the analysis and recognises the effort to balance short-term stabilisation with longer-term strategic considerations.

At the same time, several members remain concerned that the current approach may underestimate the speed at which external perceptions can change. In particular, the temporary increase in leverage and the reliance on short-term financing instruments were discussed critically.

Some members would welcome a more explicit prioritisation, even if this implies clearly accepting certain strategic or operational downsides. Others emphasised that repeated signalling of 'temporary effects' risks eroding confidence if similar situations occur again.

Against this background, the Supervisory Board asks the Executive Board to further elaborate:

• which concrete thresholds would trigger a shift towards a more defensive stance;
• how the proposed measures will be communicated consistently to lenders, rating agencies and internal stakeholders;
• and which strategic initiatives would be reconsidered first should the stress scenario persist.

The tone of the discussion reflects not mistrust, but the heightened responsibility felt by the Supervisory Board in the current environment.`,
  },
  {
    id: 'doc-25',
    slug: 'leadership-workshop-summary',
    title: 'Executive Leadership Workshop — One-Page Summary',
    category: 'Internal Perspectives',
    type: 'report',
    shortDescription: 'Half-day workshop summary identifying structural tensions, implicit non-decisions, and the need for enterprise-level leadership realignment.',
    readingTime: 5,
    order: 25,
    isImportant: true,
    body: `Internal Leadership Workshop — Executive One-Page Summary
Date: January 7, 2026
Location: Cologne
Format: Half-day leadership workshop
Participants: Executive Board, Business Unit Heads, Regional CEOs
Objective: Establish a shared fact base and leadership alignment

1. Situation Assessment
• Operating performance remains robust across business units
• Cash flow and efficiency targets are increasingly binding
• Steering mechanisms show growing internal contradictions
• Target conflicts are managed implicitly rather than resolved explicitly

2. Key Structural Tensions
• Market responsiveness vs. efficiency and cost discipline
• Flexibility at the front line vs. system stability and standardisation
• Accountability for results vs. limited decision authority
• Short-term cash discipline vs. service levels and growth ambitions

3. Current Organisational Response
• Increased reliance on managerial discretion and informal decisions
• Sustained overtime and personal commitment in critical roles
• Selective rule-bending to protect customer and revenue outcomes
• Escalations avoided to preserve short-term stability

4. Emerging Risks
• Gradual erosion of leadership clarity and credibility
• Rising frustration and cynicism in experienced management layers
• Increased vulnerability to external recruitment pressure
• Growing dependence on informal workarounds

5. Core Insight
• The challenge is neither operational nor purely financial
• It is a leadership and steering issue at enterprise level
• Non-decision has become an implicit decision with material risk
• Explicit prioritisation is required to restore system coherence

Implication: Without explicit prioritisation and clear decision ownership, organisational strain will continue to increase despite strong reported performance.`,
  },
  {
    id: 'doc-26',
    slug: 'strategic-swot-analysis',
    title: 'Strategic SWOT Analysis — Varexia Group',
    category: 'Key Challenges',
    type: 'analysis',
    shortDescription: 'Comprehensive SWOT analysis identifying strengths, weaknesses, opportunities, and threats across the portfolio.',
    readingTime: 5,
    order: 26,
    isImportant: true,
    body: `Varexia SE — Strategic SWOT Analysis

STRENGTHS
• Diversified revenue base across four complementary business segments with €42 bn total revenue
• Strong market positions in European retail with established brand recognition and customer loyalty
• Energy & Infrastructure division generating attractive 11.5% EBITDA margins with long-term contracted revenues
• Digital Services unit achieving 16.7% margins, demonstrating capability in high-value consulting
• Experienced management team with deep operational expertise across all divisions
• Extensive logistics network providing competitive advantage in supply chain efficiency
• Established relationships with major European retail customers and key accounts

WEAKNESSES
• Free cash flow generation significantly below reported earnings due to front-loaded CAPEX and working capital absorption
• Net debt/EBITDA at 3.3x with risk of covenant breach within 12–18 months
• 28% attrition rate in Digital Services key technology roles, eroding unit value
• Lack of explicit capital allocation framework and portfolio prioritisation logic
• 40% of logistics operations remain semi-manual, creating cost disadvantage vs. automated competitors
• Incentive structures reward local optimisation rather than cross-functional collaboration
• Governance model managing tensions implicitly rather than through explicit decision frameworks
• Growing disconnect between central directives and regional market realities

OPPORTUNITIES
• Selective portfolio restructuring could unlock estimated 15–20% conglomerate discount
• Digital Services carve-out with equity participation could address talent retention and unlock value
• Logistics automation investment could reduce cost per case by 15% within 18 months
• Energy transition investments aligned with EU regulatory tailwinds and green infrastructure demand
• Proactive investor engagement could restore market confidence and support re-rating
• Working capital optimisation could release €0.8–1.2 bn in liquidity
• Cross-divisional data and digital capabilities could create differentiated customer offerings

THREATS
• Covenant breach within 12–18 months if cash flow trajectory does not improve
• Activist investor intervention forcing reactive rather than strategic portfolio decisions
• Continued talent drain in Digital Services destroying unit value before strategic action is taken
• Consumer confidence deterioration in key European markets compressing Retail margins further
• Competitor automation investments widening Logistics efficiency gap
• Rating downgrade triggering higher financing costs and restricting capital market access
• Regulatory changes in energy markets altering the risk-return profile of Infrastructure assets`,
  },
  {
    id: 'doc-27',
    slug: 'executive-summary-strategic-review',
    title: 'Executive Summary — Strategic Review Context',
    category: 'Key Challenges',
    type: 'analysis',
    shortDescription: 'High-level executive summary framing the core strategic challenge: not operational failure, but strategic ambiguity.',
    readingTime: 4,
    order: 27,
    isImportant: true,
    body: `Varexia SE — Executive Summary for Strategic Review

Varexia SE is a publicly listed European conglomerate generating €42 billion in revenue across four business divisions. While operating performance remains broadly stable, the Group faces a convergence of strategic, financial, and organisational pressures that collectively represent a material risk to long-term value creation.

The Core Challenge:
The core challenge is not operational failure but strategic ambiguity: the absence of explicit portfolio prioritisation, unclear capital allocation thresholds, and a governance model that manages tensions implicitly rather than resolving them.

Consequences:
This has led to:
• A widening gap between reported earnings and cash generation
• Growing investor scepticism (share price down 25% in 18 months)
• Internal organisational strain (survey scores averaging 2.0–2.7 on key leadership dimensions)
• Emerging covenant risk (net debt/EBITDA at 3.3x)

The Supervisory Board has commissioned a comprehensive strategic review to develop actionable recommendations for a turnaround strategy that addresses:

1. Portfolio Coherence — Which businesses belong together, and under what conditions?
2. Financial Resilience — How to restore sustainable cash generation and protect the balance sheet?
3. Leadership System Effectiveness — How to align accountability, decision authority, and incentive structures?

The new Chief Strategy Officer will be expected to lead this review and present a coherent strategic framework to the full Supervisory Board.`,
  },
  {
    id: 'doc-28',
    slug: 'conglomerate-discount-analysis',
    title: 'Portfolio Logic & Conglomerate Discount Assessment',
    category: 'Key Challenges',
    type: 'analysis',
    shortDescription: 'Analysis of the conglomerate discount, portfolio coherence questions, and potential value unlock through restructuring.',
    readingTime: 4,
    order: 28,
    isImportant: false,
    body: `Varexia SE — Portfolio Logic & Value Assessment

Current Market Perception:
The market currently applies an estimated 15–20% conglomerate discount to Varexia's sum-of-the-parts valuation. This discount reflects uncertainty about:
• The strategic rationale for maintaining four diverse business divisions under one corporate umbrella
• The absence of explicit capital allocation rules between divisions
• The perceived inability or unwillingness of management to prioritise

Sum-of-the-Parts Perspective:
• Retail & Consumer Goods (€24.5 bn revenue, 7.3% margin): Core cash generator, but margins lag pure-play retail peers
• Logistics & Supply Chain (€8.0 bn revenue, 6.9% margin): Strategically linked to Retail, but declining profitability raises questions about standalone viability
• Energy & Infrastructure (€6.5 bn revenue, 11.5% margin): Attractive margins but capital-intensive; fundamentally different business model from other divisions
• Digital Services & Consulting (€3.0 bn revenue, 16.7% margin): Highest growth and margins, but talent retention crisis threatens value

Key Questions for Strategic Review:
1. Does portfolio diversification create or destroy value in the current market environment?
2. Which divisions are genuinely synergistic vs. merely co-located under the same corporate structure?
3. What would the market pay for each division as a standalone or within a more focused group?
4. Under what conditions should Varexia proactively restructure vs. wait for market pressure to force action?

The market is signalling that ambiguity about these questions is itself a source of value destruction. Clarity — even uncomfortable clarity — would likely be rewarded.`,
  },
  {
    id: 'doc-29',
    slug: 'stress-scenario-analysis',
    title: 'Financial Stress Scenario — Downside Analysis',
    category: 'Key Challenges',
    type: 'analysis',
    shortDescription: 'Stress test modelling the financial impact of EBITDA compression, working capital squeeze, and CAPEX commitments.',
    readingTime: 4,
    order: 29,
    isImportant: false,
    body: `Varexia SE — Financial Stress Scenario Analysis

Scenario Assumptions:
This stress test models the impact of a moderate deterioration across key financial parameters over a 12-month horizon.

Impact Items:
• EBITDA margin compression (-50 bps across Group): -€210 million
• Working capital absorption (inventory build + receivables deterioration): -€180 million
• Committed CAPEX obligations (non-deferrable): -€320 million
• Lease payment obligations (fixed): -€280 million
• Dividend commitment (current policy): -€150 million

Cumulative Cash Impact: approximately -€1.14 billion additional pressure

Key Drivers of Vulnerability:
1. High fixed cost base in Retail and Logistics limits ability to flex costs quickly
2. Energy & Infrastructure CAPEX commitments are long-cycle and largely non-deferrable
3. Leasing footprint creates fixed obligations regardless of revenue performance
4. Working capital efficiency has deteriorated due to supply chain disruptions

Implications:
• Net debt/EBITDA would exceed 3.5x under stress, likely triggering covenant discussions
• Free cash flow would remain deeply negative, constraining all strategic options
• Rating agencies would likely place the Group on negative watch

Mitigating Actions Available:
• Accelerated asset disposals (€0.8–1.2 bn potential)
• CAPEX prioritisation (deferral of ~€0.6 bn non-critical items)
• Working capital programme (potential release of €0.3–0.5 bn)
• Dividend reduction or suspension

Management Assessment:
The stress scenario is not considered the base case, but the margin for error has narrowed significantly. The organisation's ability to respond decisively in a deteriorating environment depends on having pre-agreed triggers and prioritisation frameworks — which are currently absent.`,
  },
];

export function getDocumentsByCategory(category: DocumentCategory): DataRoomDocument[] {
  return dataRoomDocuments
    .filter((doc) => doc.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getDocumentBySlug(slug: string): DataRoomDocument | undefined {
  return dataRoomDocuments.find((doc) => doc.slug === slug);
}

export function getDocumentById(id: string): DataRoomDocument | undefined {
  return dataRoomDocuments.find((doc) => doc.id === id);
}

export function getAllDocuments(): DataRoomDocument[] {
  return [...dataRoomDocuments].sort((a, b) => a.order - b.order);
}

export function getImportantDocuments(): DataRoomDocument[] {
  return dataRoomDocuments.filter((doc) => doc.isImportant).sort((a, b) => a.order - b.order);
}

export function searchDocuments(query: string): DataRoomDocument[] {
  const lowerQuery = query.toLowerCase();
  return dataRoomDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.shortDescription.toLowerCase().includes(lowerQuery) ||
      doc.body.toLowerCase().includes(lowerQuery) ||
      doc.category.toLowerCase().includes(lowerQuery)
  );
}

export function getCategoryDocumentCounts(): Record<DocumentCategory, number> {
  const counts = {} as Record<DocumentCategory, number>;
  for (const cat of DATA_ROOM_CATEGORIES) {
    counts[cat] = dataRoomDocuments.filter((doc) => doc.category === cat).length;
  }
  return counts;
}
