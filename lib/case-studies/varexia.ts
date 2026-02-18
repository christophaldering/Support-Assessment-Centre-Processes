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
  to?: string;
  cc?: string;
  subject: string;
  date: string;
  read: boolean;
  important: boolean;
  content: string;
  category: 'internal' | 'external';
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

export interface CashFlowItem {
  category: string;
  item: string;
  value: number;
}

export interface StressScenarioData {
  title: string;
  items: { item: string; amount: number; comment: string }[];
  keyDrivers: string[];
  implications: string[];
}

export interface ManagementMember {
  name: string;
  role: string;
  division?: string;
}

export interface OrganigrammEntry {
  name: string;
  role: string;
  department: string;
  reportsTo: string | null;
}

export interface BriefingData {
  role: string;
  situation: string;
  tasks: string[];
  analysisQuestions: string[];
  conclusionQuestions: string[];
  timeMinutes: number;
  presentationMinutes: number;
}

export interface BoardImpression {
  title: string;
  topic: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  subtitle: string;
  content: string;
  source: string;
  date: string;
}

export interface AnalystReport {
  source: string;
  observations: string[];
  criticalQuestions: string[];
  indicators: { label: string; value: string }[];
  conclusion: string;
}

export interface Protocol {
  id: string;
  title: string;
  date: string;
  location?: string;
  participants?: string;
  type: 'workshop' | 'committee' | 'meeting' | 'speech' | 'summary';
  content: string;
}

export interface HRSurveyData {
  title: string;
  participantsInvited: number;
  responseRate: number;
  categories: {
    name: string;
    items: { question: string; score: number }[];
  }[];
  comments: string[];
  hrComment: string;
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
  cashFlow: CashFlowItem[];
  stressScenario: StressScenarioData;
  managementTeam: ManagementMember[];
  boardImpressions: BoardImpression[];
  newsArticles: NewsArticle[];
  analystReport: AnalystReport;
  protocols: Protocol[];
  hrSurvey: HRSurveyData;
  leadershipSummary: string;
  leadershipConference: string;
  organigramm?: OrganigrammEntry[];
  briefing?: BriefingData;
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
      category: "internal",
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
      category: "internal",
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
      category: "internal",
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
      category: "internal",
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
    {
      id: "e5",
      from: "Michael Turner, Chief Financial Officer",
      to: "Members of the Supervisory Board",
      cc: "Alexandra Rossi (CEO); Group Executive Committee",
      subject: "External Analyst Assessment - Context, implications and Next Steps",
      date: "Jan 27, 2026, 09:00 AM",
      read: false,
      important: true,
      category: "internal",
      content: `Dear Members of the Supervisory Board,

I am sharing this note with a degree of personal candor that may feel unusual for a CFO communication. However, given the increasing external attention on our financial profile, I believe transparency at this stage is not only appropriate but necessary.

Earlier this week, we received an external credit-style assessment from Northbridge Capital Research. While the document is not public and has no immediate contractual consequences, its content reflects questions that are beginning to surface more broadly among banks and other capital providers.

The core message is not one of alarm, but of tension: our operating performance remains solid, yet cash generation is currently lagging behind reported earnings. This gap is largely explainable - front-loaded capital expenditure, working capital absorption and the scale of our leasing footprint - but it is also becoming harder to communicate convincingly without a clearer prioritization narrative.

What gives me pause, personally, is not the numbers themselves. It is the perception that our portfolio logic and capital allocation principles may appear opaque from the outside. Even if we internally understand the trade-offs well, external stakeholders are increasingly asking how long the current balance can be maintained without constraining flexibility.

I do not believe we are facing a liquidity issue. I do believe, however, that we are approaching a point where we need to be more explicit - with ourselves and with others - about what takes precedence if conditions tighten.

I would welcome the opportunity to discuss this assessment with you in the next Supervisory Board meeting, not as a defensive exercise, but as a basis for a more structured conversation about priorities, thresholds and communication.

Kind regards,
Michael
Chief Financial Officer

Confidential - internal communication`,
    },
    {
      id: "e6",
      from: "Michael Turner, Chief Financial Officer",
      to: "Members of the Supervisory Board",
      cc: "Alexandra Rossi (CEO); Group Executive Committee",
      subject: "Liquidity stabilisation and capital allocation - coordinated response",
      date: "Jan 27, 2026, 10:00 AM",
      read: false,
      important: true,
      category: "internal",
      content: `Dear Members of the Supervisory Board,

As discussed in recent exchanges, the Group remains operationally sound. At the same time, we are experiencing short-term liquidity pressure combined with an elevated leverage profile. While none of these factors is critical in isolation, their combination requires a coordinated and transparent response.

Management therefore proposes a sequenced set of measures designed to stabilize liquidity, protect the balance sheet and preserve our strategic options.

First, we will focus on immediate liquidity stabilization. This includes tighter working capital controls, the postponement of non-critical capital expenditure of approximately €0.6 billion, and the securing of additional short-term credit lines.

Second, we intend to strengthen balance sheet resilience through selective asset disposals in the range of €0.8-1.2 billion, lease renegotiations where feasible, and increased dividend flexibility. These actions are expected to move net debt/EBITDA towards approximately 3.0x.

Third, we will explicitly safeguard strategically critical initiatives. Key growth and digital projects will be ring-fenced, clear stop-go criteria will be applied, and KPI monitoring will be further enhanced.

I would like to emphasize that this approach does not eliminate trade-offs. It does, however, make them explicit, manageable and transparent for all stakeholders.

I look forward to discussing this proposal with you in our upcoming meeting.

Kind regards,
Michael
Chief Financial Officer

Confidential - internal communication`,
    },
    {
      id: "e7",
      from: "Emily Watson, Head of Investor Relations",
      to: "Executive Board",
      subject: "Brief market update – share price performance & analyst feedback",
      date: "Jan 15, 2026, 08:00 AM",
      read: true,
      important: true,
      category: "internal",
      content: `Dear colleagues,

Here is a brief market update to help you understand the current external perception:

– The Varexia Group's share price is currently €38.40.
– Since the beginning of December, this represents a decline of around 18%.
– Increased volatility has been observed over the last six weeks, with no clear individual drivers.

Feedback from discussions with investors and sell-side analysts indicates that the focus is less on operating performance and more on cash flow development, the pace of investment, and prioritization.

Short excerpt from analyst call (IR summary)

"We don't see a crisis, but we also don't see clear prioritization. The question is less what Varexia is doing and more when the company is prepared to adjust course if cash flow and capital commitment do not improve."

There are currently no acute ad hoc events. Nevertheless, further developments are being closely monitored.

Best regards,
Emily
Investor Relations

Confidential - internal communication`,
    },
    {
      id: "e8",
      from: "Jean-Marc Lefèvre, Chair of the Supervisory Board",
      to: "Michael Turner (CFO)",
      subject: "Reflections on liquidity management and strategic priorities",
      date: "Jan 18, 2026, 11:00 AM",
      read: true,
      important: true,
      category: "internal",
      content: `Dear Michael,

thank you for the outline of the proposed measures in response to the recent cashflow developments. The Supervisory Board appreciates the clarity of the analysis and recognises the effort to balance short-term stabilisation with longer-term strategic considerations.

At the same time, several members remain concerned that the current approach may underestimate the speed at which external perceptions can change. In particular, the temporary increase in leverage and the reliance on short-term financing instruments were discussed critically.

Some members would welcome a more explicit prioritisation, even if this implies clearly accepting certain strategic or operational downsides. Others emphasised that repeated signalling of 'temporary effects' risks eroding confidence if similar situations occur again.

Against this background, the Supervisory Board asks the Executive Board to further elaborate:

- which concrete thresholds would trigger a shift towards a more defensive stance;
- how the proposed measures will be communicated consistently to lenders, rating agencies and internal stakeholders;
- and which strategic initiatives would be reconsidered first should the stress scenario persist.

The tone of the discussion reflects not mistrust, but the heightened responsibility felt by the Supervisory Board in the current environment.

Kind regards
Jean-Marc Lefèvre
Chair of the Supervisory Board

Confidential - internal communication`,
    },
    {
      id: "e9",
      from: "Peter Kennen, Senior Analyst - European Consumer & Infrastructure",
      to: "Investor Relations",
      subject: "Request for clarification on financial flexibility",
      date: "Jan 23, 2026, 14:00 PM",
      read: true,
      important: true,
      category: "external",
      content: `Dear Investor Relations Team,

following the recent market discussions around capital allocation and balance sheet resilience in the European retail and infrastructure sector, we would appreciate further clarification on the Group's current financial flexibility.

While the FY 2025 results demonstrate solid operating performance, investors have noted the combination of elevated leverage, front-loaded capital expenditure and working capital volatility. In particular, questions have been raised as to how sensitive free cash flow generation is to moderate deviations from plan.

Against this backdrop, could you please comment on:

- the expected trajectory of net debt / EBITDA over the next 12-24 months;
- the degree of flexibility embedded in the current investment programme;
- and the implications for dividend policy should cashflow pressure persist.

We are asking these questions in the context of an upcoming sector note and would value your perspective to ensure an accurate representation of the Group's financial positioning.

Kind regards,
Peter Kennan
Senior Analyst
European Consumer & Infrastructure

Confidential - internal communication`,
    },
    {
      id: "e10",
      from: "Anna Keller, Regional Operations Manager Retail West",
      to: "Thomas Berger, Head of Logistics Region West",
      cc: "Finance BP Retail, Regional Management",
      subject: "Urgent: Delivery prioritization February",
      date: "Jan 17, 2026, 07:30 AM",
      read: true,
      important: false,
      category: "internal",
      content: `Hello Thomas,

Due to the hub failure in Dortmund, around 30% of our planned transport capacity will not be available for the next two days.

The following are critical for retail:

– The ongoing weekend promotion in the Cologne/Düsseldorf metropolitan areas
– Several key accounts with confirmed delivery windows

I need a clear statement today as to which stores we can prioritize. Without targeted prioritization, we risk customer escalations.

Best regards,
Anna
Regional Operations Manager Retail West

Confidential - internal communication`,
    },
    {
      id: "e11",
      from: "Julia Meier, Finance BP Retail",
      to: "Thomas Berger; Anna Keller",
      cc: "Regional Management",
      subject: "Re: Urgent: Delivery prioritization February",
      date: "Jan 17, 2026, 09:15 AM",
      read: true,
      important: false,
      category: "internal",
      content: `For reference:

– Option A: approx. €180,000 in additional costs, risk of negative margins in individual regions
– Option B: approx. €90,000 in additional costs, lower individual risks

From a financial perspective, there is no approved exception for unplanned additional costs of this magnitude. Please provide a clear justification for your decision.

Confidential - internal communication`,
    },
    {
      id: "e12",
      from: "Claire Dubois, HR Business Partner Region West",
      to: "Regional Management Retail & Logistics West",
      cc: "Operations Management, HR Management",
      subject: "Challenging situation in logistics and retail – urgent action required",
      date: "Jan 19, 2026, 10:00 AM",
      read: true,
      important: true,
      category: "internal",
      content: `Dear colleagues,

In the course of ongoing promotional and special transport operations, we are observing a sustained high workload in the logistics and retail operating units.

Particularly noticeable are:

– repeated overtime over several weeks,
– increasing sick leave in individual shifts,
– initial feedback on intentions to change jobs or resign among experienced managers at shift and team leader level.

Current performance is largely ensured by personal commitment and overtime. From an HR perspective, this is possible in the short term, but it is not a sustainable solution.

Without clear prioritization of requirements and visible relief, there is a risk that motivation, stability, and loyalty in key areas will decline.

Best regards,
Claire
HR Business Partner, West Region

Confidential - internal communication`,
    },
    {
      id: "e13",
      from: "Stefan Lauth, Retail South",
      to: "Executive Board",
      cc: "Works council chairperson, general works council",
      subject: "Question regarding current steering system",
      date: "Dec 31, 2025, 09:00 AM",
      read: true,
      important: false,
      category: "internal",
      content: `DIFFICULT TO UNDERSTAND AND TO EXPLAIN:

We are meeting our sales targets and are on track with our results. At the same time, budgets are being frozen and investments postponed. I find it difficult to explain this plausibly to my teams.

THIS CAN'T BE RIGHT...

Regards, Stefan`,
    },
    {
      id: "e14",
      from: "Sophie Lambert, Group Procurement Director, EuroMart S.A.",
      to: "Commercial Management, Group Retail Division",
      cc: "Regional Operations, Key Account Team",
      subject: "Service Reliability and Pricing Alignment - Immediate Clarification Requested",
      date: "Jan 27, 2026, 08:00 AM",
      read: false,
      important: true,
      category: "external",
      content: `Dear colleagues,

I am writing to you directly as the recent developments across several of our joint regions have begun to raise concerns at Group level.

Over the past eight weeks, we have observed repeated deviations from agreed delivery windows, as well as short-notice adjustments to promotional volumes. While we appreciate the broader market pressures currently affecting the sector, the cumulative impact on store operations is becoming difficult to absorb.

In parallel, we have received revised pricing proposals for the upcoming quarter that, in their current form, are not fully aligned with the commercial framework agreed for 2025.

Taken individually, none of these issues would warrant escalation. Taken together, they do.

EuroMart has historically valued the reliability and predictability of our partnership as much as its economic terms. We would therefore appreciate a clear view on how service stability and pricing consistency will be ensured going forward.

I would welcome a coordinated response within the next ten working days, outlining both short-term corrective actions and your perspective on the coming quarters.

Kind regards,
Sophie
Group Procurement Director, EuroMart S.A. Commercial`,
    },
    {
      id: "e15",
      from: "Isabelle Fournier, CIO",
      to: "Group Executive Board",
      cc: "Thomas Schneider (COO), Michael Turner (CFO)",
      subject: "Promotion Week 38 - system behaviour and decision logic",
      date: "Jan 18, 2026, 14:00 PM",
      read: true,
      important: false,
      category: "internal",
      content: `Following the discussions around Promotion Week 38, I would like to clarify how the system behaved and why.

From a technical perspective, the planning and replenishment systems functioned exactly as configured. The late upward adjustment of demand (+12%) did not cross the agreed escalation threshold of +20%. Consequently, no automated capacity re-planning was triggered.

This threshold was deliberately defined to protect system stability and planning reliability during promotional periods. At the time, resilience was prioritized over maximum flexibility.

What this incident highlights is not a technical failure, but a decision dilemma: Do we want systems that strictly enforce rules, or systems that allow earlier overrides at the cost of volatility and complexity?

Both approaches are valid. What is not sustainable is expecting flexibility, stability and cost efficiency simultaneously without explicit prioritization and decision rights.

Before adjusting thresholds or architecture, we should therefore clarify which trade-offs we accept going forward and who is authorized to decide in real time.

Best regards,
Isabelle

Confidential - internal communication`,
    },
    {
      id: "e16",
      from: "Peter Smith, Regional CEO Central Europe",
      to: "Executive Board",
      cc: "Thomas Schneider (COO), Michael Turner (CFO)",
      subject: "Urgent need for action – growing unrest in the regions",
      date: "Jan 25, 2026, 16:00 PM",
      read: false,
      important: true,
      category: "internal",
      content: `Dear colleagues,

I would like to address an issue that I believe is time sensitive.

The current conflicts between objectives and management (responsibility for results vs. strict central guidelines) can no longer be quietly compensated for across the board. There is noticeable unrest in the regions, especially among managers in key positions who bear responsibility without having clear guidance.

Regardless of any subsequent clarification of the content, I believe it is necessary to send a visible signal in the short term that the fundamental problem is being addressed. Otherwise, there is a risk that uncertainty and frustration will continue to grow—with corresponding effects on retention and poaching activities by competitors.

I am explicitly not concerned with a quick solution, but rather with timely action and clarity that the issue is being taken up at the executive board level and dealt with in a structured manner.

Best regards,
Peter
Regional CEO Central Europe

Confidential - internal communication`,
    },
    {
      id: "e17",
      from: "Peter Wagner, CHRO",
      to: "Executive Board",
      subject: "Reflections on leadership system and structural priorities",
      date: "Jan 27, 2026, 11:00 AM",
      read: false,
      important: true,
      category: "internal",
      content: `Following the recent escalation meeting on the topic of Integrated Planning & Promotion Platform, I would like to share with you some observations from an HR perspective that go beyond purely operational issues.

The exchange between Retail, Logistics, IT, Finance, and Operations has made it clear that the current challenges lie less in individual processes and more in the way roles, decision-making logic, and responsibilities are structured across departments. Several contributions made it clear that managers are increasingly reaching the limits of what can be consistently implemented with the existing structures.

Key observations from an HR perspective

1. Increasing tension between responsibility and decision-making latitude

It was made very clear, especially from the regions, that operational responsibility without corresponding decision-making authority leads to a feeling of structural powerlessness. This point was addressed with unusual clarity, indicating a growing dissatisfaction.

2. Functional logics are diverging

The discussion showed once again that central requirements for stability, efficiency, and adherence to rules clash with regional market needs. All arguments were rational—but they followed different, sometimes contradictory management logics. A common end-to-end ownership is not currently apparent.

3. High friction losses due to unclear priorities

The recurring references to scope creep, lack of capacity, unclear ROI expectations, and parallel escalations in operational business indicate that prioritization is not sufficiently transparent or binding.

4. Risk to leadership culture and motivation

The dynamics of the discussion—especially the silence after the HR intervention in the meeting—show that the conflict has long since become emotional. There is a risk that experienced leaders will begin to withdraw, not out of disengagement, but out of exhaustion and a perceived lack of structural support.

5. Incentive structures reinforce local optimization

The current target and incentive system rewards functional excellence. It does not sufficiently encourage cross-functional collaboration, end-to-end ownership, or early escalation. This creates a structural disincentive to act in the interest of the whole.

6. Capacity is not a resource issue—it is a prioritization issue

Several managers have indicated that they are not lacking resources in absolute terms, but clarity on what to prioritize and what to deprioritize. The absence of explicit trade-offs leads to overload, not underperformance.

7. Cultural signal risk

If the current pattern continues—strong performance driven by personal commitment and informal workarounds—there is a risk that the organization normalizes a mode of operating that is neither sustainable nor scalable. The longer this persists, the harder it becomes to course-correct without significant disruption.

I would recommend that these observations be discussed at Executive Board level, not as an HR topic, but as a leadership system question.

Kind regards,
Peter Wagner
CHRO

Confidential - internal communication`,
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
  cashFlow: [
    { category: "Operating activities", item: "EBITDA", value: 3.612 },
    { category: "Operating activities", item: "Depreciation & amortization", value: 2.184 },
    { category: "Operating activities", item: "Provisions (pensions, others)", value: 0.248 },
    { category: "Operating activities", item: "Working capital", value: -1.396 },
    { category: "Operating activities", item: "Income taxes paid", value: -0.862 },
    { category: "Operating activities", item: "Net cash from operating activities", value: 3.786 },
    { category: "Investing activities", item: "Capital expenditure (PP&E)", value: -1.482 },
    { category: "Investing activities", item: "Capital expenditure (ROU assets)", value: -0.846 },
    { category: "Investing activities", item: "Proceeds from asset disposals", value: 0.318 },
    { category: "Investing activities", item: "Investments in associates & JVs", value: -0.214 },
    { category: "Investing activities", item: "Net cash from investing activities", value: -2.224 },
    { category: "Financing activities", item: "Net change in financial debt", value: 0.742 },
    { category: "Financing activities", item: "Net change in lease liabilities", value: 0.391 },
    { category: "Financing activities", item: "Dividends paid", value: -0.624 },
    { category: "Financing activities", item: "Interest paid", value: -0.518 },
    { category: "Financing activities", item: "Net cash from financing activities", value: -0.009 },
  ],
  stressScenario: {
    title: "Cashflow Stress Scenario 2026",
    items: [
      { item: "EBITDA (plan)", amount: 3.70, comment: "Broadly in line with expectations" },
      { item: "Delta working capital", amount: -1.40, comment: "Inventory build-up & delayed receivables" },
      { item: "CAPEX (incl. IFRS 16)", amount: -2.30, comment: "Timing shift into H1 2026" },
      { item: "Cash taxes & pensions", amount: -0.90, comment: "One-off effects" },
      { item: "Operating Free Cash Flow", amount: -0.90, comment: "Negative earlier than planned" },
      { item: "Net financing effects", amount: 0.40, comment: "Short-term facilities utilized" },
      { item: "Net change in cash", amount: -0.50, comment: "Liquidity buffer reduced" },
    ],
    keyDrivers: [
      "Faster-than-expected inventory build-up in Retail & Consumer Goods",
      "Service-level stabilization in Logistics increasing short-term costs",
      "Front-loaded CAPEX in Energy & Infrastructure projects",
      "Limited flexibility in lease-related cash outflows",
    ],
    implications: [
      "Net debt / EBITDA temporarily increases above 3.6x",
      "Internal liquidity buffer falls below comfort range",
      "Increased sensitivity to interest rate movements",
      "Rating agencies request additional transparency",
    ],
  },
  managementTeam: [
    { name: "Alexandra Rossi", role: "CEO" },
    { name: "Michael Turner", role: "CFO" },
    { name: "Thomas Schneider", role: "COO" },
    { name: "Isabelle Fournier", role: "CIO" },
    { name: "Peter Wagner", role: "CHRO" },
    { name: "Jean-Marc Lefèvre", role: "Chair of the Supervisory Board" },
  ],
  boardImpressions: [
    { title: "Discussion regarding share price development", topic: "1/3" },
    { title: "Discussion regarding Strategic Options", topic: "2/3" },
    { title: "Discussion regarding Asset Allocation and Governance", topic: "3/3" },
  ],
  newsArticles: [
    {
      id: "news1",
      headline: "Varexia's trading division faces a delicate balancing act – cash flow becomes the focus",
      subtitle: "Solid operational performance masks growing tensions between investment ambitions and financial discipline",
      date: "January 2026",
      source: "Industry Press",
      content: `The trading and infrastructure group Varexia is facing a delicate phase in its strategic cycle. Although its operating business is stable, even relatively minor deviations from the plan are having an increasingly noticeable effect on free cash flow – and are bringing capital allocation more sharply into focus for the Management Board, Supervisory Board, and external observers.

According to information from the company's environment, the timing and scope of investments and changes in working capital have become particularly important in recent months. While sales and margin figures continue to appear robust, liquidity developments are becoming the focus of internal discussions.

Rating agencies are not alarmed so far, but are monitoring developments more closely – an indication of increased sensitivity to debt and financing flexibility.

Varexia, whose business areas range from food retail to logistics and energy infrastructure to digital services, generated revenues of around €42 billion in the past fiscal year with stable operating margins. Nevertheless, free cash flow is said to have come under pressure earlier than originally expected. The main drivers are considered to be front-loaded investments, particularly in logistics and energy projects, as well as inventory build-ups in individual business areas.

Management points to the resilience of the core business and the Group's broad earnings base. Internally, however, this development has triggered an intense debate about priorities. The central question is how ambitious growth programs can be reconciled with the need for balance sheet discipline and control.

The tension is particularly evident in the classic conflicts of interest faced by large retail groups: Varexia wants to invest in price attractiveness and customer experience, while simultaneously needing to ensure supply chain efficiency and maintain financial headroom. Several market observers note that this balancing act has become visibly more difficult.`,
    },
    {
      id: "news2",
      headline: "Competition in the European trade and logistics market is intensifying noticeably",
      subtitle: "Industry analysis: Market dynamics and competitive landscape",
      date: "January 2026",
      source: "Market Analysis",
      content: `Competition in the European trade and logistics market is intensifying noticeably. According to market observers, major competitors are increasingly resorting to price promotions while simultaneously reviewing their investment programs.

In particular, the balance between growth, service quality, and financial stability is becoming more important. Several industry experts point out that delivery reliability and operational resilience are increasingly proving to be differentiating factors, especially in large-scale retail formats.

At the same time, a comparison with competitors shows that the debt levels of some market participants are already at the upper end of the industry spectrum. Although overall profitability remains solid, the ability to finance investments from current cash flow is being questioned more critically.

Other retail groups are already responding by temporarily curbing their investments in order to secure financial leeway. This restraint could increase competitive pressure for those who continue to expand aggressively.

Industry experts therefore expect strategic priorities to shift in the coming quarters. The question is less whether to invest, but at what pace – and with what risk.`,
    },
  ],
  analystReport: {
    source: "Northbridge Capital Research",
    observations: [
      "Reported EBITDA stability masks a structurally weak cash conversion profile.",
      "Over the past fiscal year, working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.",
      "From an external perspective, the Group's portfolio composition remains challenging to assess. High-volume retail operations, capital-intensive infrastructure assets and a rapidly scaling digital unit coexist without clearly articulated capital allocation thresholds.",
    ],
    criticalQuestions: [
      "How resilient is the current investment trajectory should free cash flow remain negative for another investment cycle?",
    ],
    indicators: [
      { label: "EBITDA", value: "€3.600 bn" },
      { label: "Operating cash flow*", value: "€1.602 bn" },
      { label: "Cash conversion (OCF / EBITDA)", value: "45.5%" },
      { label: "Net CAPEX incl. leases", value: "-€2.328 bn" },
      { label: "Free cash flow", value: "-€0.73 bn" },
      { label: "Net debt / EBITDA", value: "3.3x" },
    ],
    conclusion: "Northbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritization, current trajectory may limit strategic optionality.",
  },
  protocols: [
    {
      id: "p1",
      title: "Workshop Protocol - Commercial & Market Alignment",
      date: "27 January 2026",
      location: "Regional Sales Hub, Cologne",
      participants: "Regional Sales Hub, Cologne",
      type: "workshop",
      content: `1. Opening & shared understanding

The workshop was opened by the Head of Commercial Excellence, who framed the session as a deliberate pause to reflect on growing tensions between market expectations and internal steering mechanisms. Participants were explicitly encouraged to speak openly and without immediate solution pressure.

Several participants noted that recent customer escalations should not be seen as isolated incidents, but as signals of a broader shift in market behaviour.

2. Market observations from the sales organisation

Sales representatives reported a noticeable change in the tone of customer discussions. Price comparisons with competitors are now raised much earlier in negotiations, often supported by concrete alternative offers.

In parallel, customers increasingly question delivery reliability and operational flexibility. What had previously been accepted as occasional deviations is now perceived as structural rigidity.

One participant summarised this sentiment by stating:

"We are no longer negotiating from a position of trust. Customers assume alternatives exist and expect us to justify why we are still the right partner."

3. Internal constraints and perceived misalignment

A recurring theme was the perceived gap between centrally defined pricing corridors and the realities of customer-facing negotiations. While participants acknowledged the financial rationale behind tighter controls, many expressed concern about their cumulative impact on relationship management.

Operational representatives added that capacity allocation and delivery windows are increasingly optimised for efficiency, leaving limited room for ad-hoc adjustments requested by key accounts.

"Finance optimises margins quarterly. Sales lives with consequences daily."`,
    },
    {
      id: "p2",
      title: "Internal Fuck-up Speech – DRAFT",
      date: "January 2026",
      participants: "Key Account Management Austria",
      type: "speech",
      content: `A short story to start

Last Tuesday evening, I walked into a store on my way home. Front aisle. Promotion display. The price label was there. The shelf was empty. A store manager stood next to me, on the phone, explaining to a customer why an advertised product was not available on day two of a national promotion.

I did not introduce myself. I just listened. That moment was uncomfortable. Not because someone had made a mistake. But because it was painfully obvious that the system had worked exactly as we had designed it to work.

What actually went wrong

Retail pushed for availability. Logistics pushed for efficiency. IT pushed for stability. Each of us did what our targets told us to do. And each of us was locally right.

Why that was not enough

Together, we optimized ourselves out of a good overall result. We had no clear end-to-end owner, no shared definition of success, and no early escalation when priorities collided.

The uncomfortable truth

We compensated with overtime, manual fixes and goodwill. That saved the week. It did not fix the system. And it made the next failure more likely, not less.

What must change

If we want different outcomes, we need different ownership, different KPIs and explicit trade-offs. Otherwise, we will repeat this story - with different products, but the same ending.

Internal use / Learning oriented reflection – not a blame statement.`,
    },
    {
      id: "p3",
      title: "Digital Steering Committee – Formal Minutes",
      date: "25 January 2026",
      participants: "Alexandra Rossi (CEO), Michael Turner (CFO), Isabelle Fournier (CIO), Heads of Retail, Logistics, HR",
      type: "committee",
      content: `Agenda Item 3 - Integrated Planning & Promotion Platform

Status: Amber | Timeline: +6 months | Budget utilization: 72% | Business case: to be refined

Discussion (Excerpt)

Retail reiterates urgency following recent promotion issues. Logistics emphasizes need for planning stability. IT highlights scope creep and limited development capacity. Finance requests updated ROI and short-term impact. Operations notes general alignment but asks for clearer next steps.

Decisions

Agreement to refine scope. Agreement to update business case. Agreement to revisit governance model. (No formal decision taken.)

Action Items

IT to prepare revised roadmap (4 weeks). Business to clarify prioritization criteria (open). Finance to reassess ROI assumptions (open).`,
    },
    {
      id: "p4",
      title: "Meeting notes: Exchange with rating agency",
      date: "26 January 2026",
      participants: "Michael Turner (CFO), Senior Director European Corporates (Rating agency)",
      type: "meeting",
      content: `Format: Phone call (informal, approx. 30 minutes)

Classification by the rating agency
• No formal rating review
• No short-term rating action planned
• Nevertheless: increased internal attention on Varexia
• Increasingly classified in peer comparison (retail/infrastructure/diversified groups)

Operative Performance
• Operating business continues to be assessed as stable
• Revenue and EBITDA development generally positive
• Portfolio diversification recognized

Cashflow & financial profile
• Cash conversion (OCF/EBITDA) significantly below historical levels
• Deviation from peers increasingly noticeable
• Main drivers from the rating agency's perspective:
  - Front-loaded CAPEX
  - Working capital tied up
  - Scope and inflexibility of the leasing footprint
  - Individual effects explainable – cumulative effect relevant

Capital allocation & governance (external perception)
• Strategic rationale behind individual investments comprehensible
• Uncertainty regarding:
  - Priorities in the event of conflicting objectives
  - Explicit thresholds (e.g., net debt/EBITDA)
  - Conditions for price adjustments
• Quote from the conversation:
"Not the question of what you do – but under which conditions you would change course."

Expectations (implicit)
• No measures in the short term
• With cash flow pressure persisting, increasing focus on:
  - Net debt/EBITDA development (12–18 months)
  - Visibility of prioritization
  - Consistency of internal and external communication
• Governance and management quality are becoming increasingly important

Internal evaluation:
• No acute escalation
• Perception: probationary phase, not crisis
• External stakeholders expect clearer prioritization and consistent communication`,
    },
    {
      id: "p5",
      title: "Internal Leadership Workshop – Executive One-Page Summary",
      date: "7 January 2026",
      location: "Cologne",
      participants: "Executive Board, Business Unit Heads, Regional CEOs",
      type: "summary",
      content: `When performance remains strong, but the system shows structural strain

1. Context
• Date: 7 January 2026
• Location: Cologne | On-site
• Format: Half-day leadership workshop
• Participants: Executive Board, Business Unit Heads, Regional CEOs
• Objective: Establish a shared fact base and leadership alignment

2. Situation Assessment
• Operating performance remains robust across business units
• Cash flow and efficiency targets are increasingly binding
• Steering mechanisms show growing internal contradictions
• Target conflicts are managed implicitly rather than resolved explicitly

3. Key Structural Tensions
• Market responsiveness vs. efficiency and cost discipline
• Flexibility at the front line vs. system stability and standardization
• Accountability for results vs. limited decision authority
• Short-term cash discipline vs. service levels and growth ambitions

4. Current Organizational Response
• Increased reliance on managerial discretion and informal decisions
• Sustained overtime and personal commitment in critical roles
• Selective rule-bending to protect customer and revenue outcomes
• Escalations avoided to preserve short-term stability

5. Emerging Risks
• Gradual erosion of leadership clarity and credibility
• Rising frustration and cynicism in experienced management layers
• Increased vulnerability to external recruitment pressure
• Growing dependence on informal workarounds

6. Core Insight
• The challenge is neither operational nor purely financial
• It is a leadership and steering issue at enterprise level
• Non-decision has become an implicit decision with material risk
• Explicit prioritization is required to restore system coherence

Implication: Without explicit prioritization and clear decision ownership, organizational strain will continue to increase despite strong reported performance.`,
    },
  ],
  hrSurvey: {
    title: "Leadership & Ownership Pulse Survey 2025",
    participantsInvited: 320,
    responseRate: 68,
    categories: [
      {
        name: "Role Clarity & Ownership",
        items: [
          { question: "I have sufficient decision authority to fulfil my responsibilities.", score: 2.4 },
          { question: "Accountability and decision rights are aligned in my role.", score: 2.1 },
          { question: "When priorities conflict, it is clear who decides.", score: 2.3 },
        ],
      },
      {
        name: "Targets & Incentives",
        items: [
          { question: "My targets encourage collaboration across functions.", score: 2.0 },
          { question: "I am rewarded for end-to-end outcomes, not just local optimization.", score: 1.9 },
          { question: "I sometimes act against my own targets to do what I believe is right.", score: 3.2 },
        ],
      },
      {
        name: "Pressure & Sustainability",
        items: [
          { question: "My workload is sustainable over the next 12 months.", score: 2.2 },
          { question: "I have enough capacity to focus on improvement, not just firefighting.", score: 1.8 },
          { question: "I feel comfortable raising concerns early.", score: 2.5 },
        ],
      },
      {
        name: "Trust & Leadership",
        items: [
          { question: "I trust senior management to consider local realities.", score: 2.6 },
          { question: "Central decisions are explained in a way I can relate to.", score: 2.3 },
          { question: "I see a clear and consistent direction for the organization.", score: 2.7 },
        ],
      },
    ],
    comments: [
      "I am accountable for results, but I don't feel empowered to influence the outcome.",
      "We solve problems with personal commitment and overtime - not with structures.",
      "The organization talks about ownership but avoids making ownership explicit.",
    ],
    hrComment: "The data indicates a structural tension between responsibility, authority and incentives. This is not a motivation issue. It is a leadership system issue.",
  },
  leadershipSummary: `When performance remains strong, but the system shows structural strain

1. Context
• Date: 7 January 2026
• Location: Cologne | On-site
• Format: Half-day leadership workshop
• Participants: Executive Board, Business Unit Heads, Regional CEOs
• Objective: Establish a shared fact base and leadership alignment

2. Situation Assessment
• Operating performance remains robust across business units
• Cash flow and efficiency targets are increasingly binding
• Steering mechanisms show growing internal contradictions
• Target conflicts are managed implicitly rather than resolved explicitly

3. Key Structural Tensions
• Market responsiveness vs. efficiency and cost discipline
• Flexibility at the front line vs. system stability and standardization
• Accountability for results vs. limited decision authority
• Short-term cash discipline vs. service levels and growth ambitions

4. Current Organizational Response
• Increased reliance on managerial discretion and informal decisions
• Sustained overtime and personal commitment in critical roles
• Selective rule-bending to protect customer and revenue outcomes
• Escalations avoided to preserve short-term stability

5. Emerging Risks
• Gradual erosion of leadership clarity and credibility
• Rising frustration and cynicism in experienced management layers
• Increased vulnerability to external recruitment pressure
• Growing dependence on informal workarounds

6. Core Insight
• The challenge is neither operational nor purely financial
• It is a leadership and steering issue at enterprise level
• Non-decision has become an implicit decision with material risk
• Explicit prioritization is required to restore system coherence

Implication: Without explicit prioritization and clear decision ownership, organizational strain will continue to increase despite strong reported performance.`,
  leadershipConference: `Navigating a More Fragmented World

Excerpt from the internal leadership newsletter – December 2025

As part of this year's Global Leadership Conference in November, senior leaders from across the Varexia Group came together to reflect on the company's strategic priorities and the broader environment in which we operate.

One of the external highlights of the conference was a keynote delivered by Peter Neumann, senior partner from McKinsey & Company, who provided a concise but thought-provoking perspective on recent shifts in the global economic and political landscape.

In his talk, Peter described how the world is moving away from a broadly rules-based, predictable order towards a more fragmented and multipolar reality. Trade flows, energy markets, technology ecosystems and regulatory regimes, he argued, are increasingly shaped by geopolitical considerations rather than purely economic logic. As a result, volatility and uncertainty are becoming structural features rather than temporary disruptions.

While the presentation deliberately avoided political assessments, it resonated strongly with many participants because of its implications for leadership and decision-making in large organizations.

A central message of the keynote was that in a multipolar environment, contradictions cannot simply be optimized away. Efficiency, resilience, flexibility and financial discipline often pull in different directions. Where such tensions used to be manageable through implicit compromises and informal coordination, they now tend to surface more sharply and more frequently.

Several leaders noted in subsequent discussions that this perspective helped them reframe current challenges within the organization. Issues around prioritization, decision authority and the balance between global standards and local responsiveness were no longer seen as isolated internal questions, but as reflections of a more complex external context.`,
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
