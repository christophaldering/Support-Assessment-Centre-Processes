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
      from: "Michael Turner, CFO",
      subject: "Briefing: Cash Flow Situation & Financial Framing",
      date: "Feb 10, 2026, 07:45 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

As part of your preparation, I want to provide a brief framing of the financial situation as we see it from the CFO perspective.

The Group's overall revenue and EBITDA development remains broadly in line with expectations. However, internally generated liquidity has come under noticeable pressure in recent months. The primary drivers are front-loaded investment activity – particularly in our logistics and infrastructure segments – as well as working capital dynamics related to seasonal effects and supply chain timing.

The resulting cash flow profile is still within manageable boundaries, but the buffer has narrowed. We are closely monitoring the development of our net debt/EBITDA ratio, which rating agencies and lenders are paying increasing attention to.

I want to be very transparent: this is not a crisis, but it is a phase that requires clear prioritization. The Board has different perspectives on how to navigate this – and that is part of the challenge you will be expected to reflect on.

I have made the relevant financial documents available in the Data Room.

Best regards,
Michael Turner
Chief Financial Officer, Varexia SE`
    },
    {
      id: "e2",
      from: "Michael Turner, CFO",
      subject: "FYI: Stress Scenario & Sensitivity Analysis",
      date: "Feb 10, 2026, 08:02 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

As a follow-up to my earlier note, I also want to draw your attention to the stress scenario we have prepared internally.

This is not a forecast – it reflects a set of plausible downside assumptions under which our cash flow position deteriorates more quickly than currently anticipated. The key drivers are an accelerated inventory build-up in Retail, front-loaded CAPEX in infrastructure, and limited flexibility in lease-related outflows.

Under this scenario, operating free cash flow turns negative and the internal liquidity buffer falls below our comfort range. Net debt/EBITDA temporarily rises above 3.6x.

I share this not to alarm, but to provide the full picture. This is the kind of information that shapes internal debates around prioritization and trade-offs.

The document is available in the Data Room.

Best regards,
Michael Turner
CFO`
    },
    {
      id: "e3",
      from: "Julia Hartmann, Head of Investor Relations",
      subject: "IR Update: Market Perception & Analyst Sentiment",
      date: "Feb 9, 2026, 04:30 PM",
      read: false,
      important: true,
      content: `Dear Candidate,

As part of the briefing materials, I wanted to provide a brief update on external market perception and investor sentiment toward Varexia SE.

Over the past 6–12 months, the tone in analyst calls and investor meetings has shifted noticeably. While operational performance continues to be acknowledged as solid, there is growing scrutiny around cash flow transparency, capital allocation and portfolio coherence.

Key themes raised by analysts and institutional investors include:
• The widening gap between reported EBITDA and free cash flow generation
• Questions around the strategic rationale for maintaining the current portfolio structure
• Increasing references to a "conglomerate discount" estimated at 25–30%
• Requests for more granular segment-level cash flow reporting

The share price has declined approximately 18% over the past 12 months, underperforming the Euro Stoxx 50 by a significant margin. Bond spreads have also widened, reflecting growing credit market concern.

I should also note that activist fund Corvus Capital has built a stake of approximately 4.8% and is increasingly vocal about portfolio restructuring. We expect them to seek board representation at the next AGM if progress is not forthcoming.

This is context you should factor into your assessment.

Best regards,
Julia Hartmann
Head of Investor Relations, Varexia SE`
    },
    {
      id: "e4",
      from: "Dr. Thomas Berner, Chairman of the Supervisory Board",
      subject: "Personal Note: Context for Your Assessment",
      date: "Feb 11, 2026, 09:00 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

I want to take a moment to share some personal observations that may help frame the task ahead of you.

Varexia is not in acute crisis. Our operating businesses are performing within acceptable ranges, and our market positions remain strong. However, I have become increasingly concerned about the trajectory we are on – not operationally, but structurally.

The Board is aligned on the problem description: we face growing tensions between investment ambitions, financial discipline and stakeholder expectations. Where we differ is on the right course of action.

Some Board members advocate a more defensive posture – tighter prioritization, balance sheet discipline, and selective divestments. Others warn that pulling back now could weaken our competitive position in markets where momentum matters.

What I expect from you today is not a solution – it is a clear-eyed, differentiated assessment. I want to understand how you read the situation, where you see the critical fault lines, and how you would approach the trade-offs that the organization currently avoids making explicitly.

The status quo is not an option. But neither is action without clarity.

I look forward to your perspective.

Best regards,
Dr. Thomas Berner
Chairman of the Supervisory Board, Varexia SE`
    },
    {
      id: "e5",
      from: "Northbridge Capital Research",
      subject: "External View: Credit-Style Assessment Note",
      date: "Feb 7, 2026, 11:15 AM",
      read: true,
      important: true,
      content: `To the attention of the Executive Board,

Please find attached our latest credit-style assessment of Varexia SE. Key observations:

1. Reported EBITDA stability masks a structurally weak cash conversion profile.
2. Working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.
3. The Group's portfolio composition remains challenging to assess from an external perspective.

Selected financial indicators:
• EBITDA: €3.600 bn
• Operating cash flow: €1.602 bn
• Cash conversion (OCF/EBITDA): 45.5%
• Net CAPEX incl. leases: -€2.328 bn
• Free cash flow: -€0.73 bn
• Net debt / EBITDA: 3.3x

Conclusion: Northbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritization, the current trajectory is unsustainable.

Full report available in the Data Room.

Northbridge Capital Research
European Corporates`
    },
    {
      id: "e6",
      from: "Isabelle Fournier, CIO",
      subject: "Note on Digital Steering Committee & Platform Decision",
      date: "Feb 8, 2026, 02:20 PM",
      read: true,
      important: false,
      content: `Dear Candidate,

I wanted to provide brief context on a topic that may come up during your assessment: the Integrated Planning & Promotion Platform.

This project sits at the intersection of several organizational tensions. Retail sees it as urgently needed following recent promotion execution failures. Logistics views it as a potential threat to planning stability. Finance is requesting a clearer business case. And my team is dealing with scope creep and limited development capacity.

The Digital Steering Committee discussed this on January 25. The status is amber, the timeline has slipped by 6 months, and budget utilization stands at 72%. We agreed to refine the scope and revisit the governance model – but no formal decision was taken.

I mention this because it illustrates a broader pattern: cross-functional initiatives that are strategically important but organizationally difficult to land. The challenge is not technical – it is about priorities, ownership and the willingness to make binding decisions.

Best regards,
Isabelle Fournier
Chief Information Officer, Varexia SE`
    },
    {
      id: "e7",
      from: "Stefan Krause, Regional CEO Central Europe",
      subject: "Perspective from the Region: Market Pressure & Internal Constraints",
      date: "Feb 9, 2026, 10:05 AM",
      read: true,
      important: false,
      content: `Dear Candidate,

I lead the Central European region – our largest market by revenue. I wanted to share a few observations from the front line.

The competitive environment has intensified noticeably over the past 12 months. Customers are better informed, more price-sensitive, and less forgiving of service failures. What used to be accepted as occasional operational hiccups is now perceived as structural rigidity.

Internally, we are experiencing a growing disconnect between centrally defined policies and the realities of customer-facing operations. Pricing corridors are tighter, delivery windows are optimized for efficiency rather than flexibility, and our ability to respond to key account requests on short notice has diminished.

I am not arguing against discipline – we need it. But I want to flag that the cumulative effect of multiple efficiency measures is starting to erode customer relationships that have been built over decades.

"Finance optimizes margins quarter by quarter. We manage relationships that span decades." – This was a comment from one of our regional sales managers at a recent workshop. It stayed with me.

Best regards,
Stefan Krause
Regional CEO, Central Europe`
    },
    {
      id: "e8",
      from: "Dr. Claudia Vogt, CHRO",
      subject: "Observations on Leadership Climate & Organizational Strain",
      date: "Feb 10, 2026, 11:30 AM",
      read: true,
      important: false,
      content: `Dear Candidate,

As CHRO, I want to share some observations on the human side of the challenges you will be assessing.

We recently conducted a Leadership & Ownership Pulse Survey across 320 senior managers. The response rate was 68%, which is high for this type of instrument. The results are sobering:

• Decision authority: 2.4 out of 5
• Alignment of accountability and decision rights: 2.1
• Sustainability of workload: 2.2
• Capacity for improvement vs. firefighting: 1.8

The qualitative comments are even more telling. Leaders describe a system where they are accountable for results but lack the authority to influence outcomes. Overtime and personal commitment are used to compensate for structural misalignment. Several leaders expressed frustration that the organization "talks about ownership but avoids making ownership explicit."

In the Digital Services unit specifically, we are seeing annualized attrition of 28% in key technical roles. Exit interviews consistently cite bureaucratic processes, lack of equity participation, and a perception of being a "second-class citizen" within the Group.

This is not a motivation issue. It is a leadership system issue.

The full survey results and HR commentary are available in the Data Room.

Best regards,
Dr. Claudia Vogt
Chief Human Resources Officer, Varexia SE`
    },
    {
      id: "e9",
      from: "Key Account Management Austria",
      subject: "Internal Lessons Learned – Promotion Execution Failure",
      date: "Feb 5, 2026, 03:45 PM",
      read: true,
      important: false,
      content: `To the Executive Board,

We would like to share a brief lessons-learned reflection following the recent promotion execution failure in our Austrian market.

The short version: Retail pushed for availability. Logistics pushed for efficiency. IT pushed for stability. Each function did what their targets told them to do. And each was locally right.

Together, we optimized ourselves out of a good overall result.

We had no clear end-to-end owner, no shared definition of success, and no early escalation when priorities collided. We compensated with overtime, manual fixes and goodwill. That saved the week – but it did not fix the system. And it made the next failure more likely, not less.

If we want different outcomes, we need different ownership, different KPIs and explicit trade-offs. Otherwise, we will repeat this story – with different products, but the same ending.

This is submitted as a learning-oriented reflection, not a blame statement.

Key Account Management Austria`
    },
    {
      id: "e10",
      from: "Alexandra Rossi, CEO",
      subject: "Framing for Today's Assessment",
      date: "Feb 11, 2026, 08:15 AM",
      read: false,
      important: true,
      content: `Dear Candidate,

Welcome. I want to briefly frame what we are looking for today.

Varexia is a company with strong market positions, dedicated people, and a solid operational foundation. At the same time, we are experiencing growing structural strain – not because the business is failing, but because the system we have built is reaching its limits under current conditions.

The tensions you will encounter in the materials are real. They are not theoretical. They affect capital allocation, leadership dynamics, customer relationships and talent retention every day. And they are interconnected in ways that make simple solutions inadequate.

What we need from you is not a consulting deck or a turnaround plan. We need a thoughtful, evidence-based assessment of where the organization stands, what the critical fault lines are, and how you would approach the decisions that currently remain unresolved.

I should be honest: there is no consensus on the Board about the right path forward. That is part of the challenge – and part of why your independent perspective matters.

I wish you a productive session.

Best regards,
Alexandra Rossi
Chief Executive Officer, Varexia SE`
    },
    {
      id: "e11",
      from: "Dr. Markus Engel, Handelsblatt",
      subject: "Press Inquiry: Covenant Situation & Rating Outlook",
      date: "Feb 12, 2026, 09:30 AM",
      read: true,
      important: false,
      content: `Dear Investor Relations Team,

Handelsblatt is preparing an article on Varexia SE's financial situation, with particular focus on debt covenant compliance and the current rating outlook.

We have received information suggesting that S&P Global Ratings is reviewing a potential outlook change from "stable" to "negative" for the company's current BBB rating. We would also like to understand the current status of discussions with relationship banks regarding covenant terms.

Could you provide a comment on the following:
1. The current Net Debt/EBITDA ratio and proximity to covenant thresholds
2. Any ongoing discussions with lenders regarding covenant amendments
3. The status of the €2.1bn commercial paper programme
4. Management's view on the pension obligations (€5.1bn) and their impact on adjusted leverage

We intend to publish on February 12. A response by end of business today would be appreciated.

Best regards,
Dr. Markus Engel
Financial Editor, Handelsblatt`
    },
    {
      id: "e12",
      from: "Customer Escalation Desk",
      subject: "Summary: Recent Customer Complaints & Service Failures",
      date: "Feb 6, 2026, 05:15 PM",
      read: true,
      important: false,
      content: `Executive Summary – Customer Escalation Report

Period: January 15 – February 5, 2026

This report summarizes recent customer escalations that have been flagged for executive attention.

Key patterns observed:
• Delivery reliability complaints have increased 23% compared to the same period last year
• Promotion availability issues: Multiple cases where advertised products were unavailable within 48 hours of promotion launch
• Key account representatives report that price negotiations are becoming more adversarial, with customers presenting concrete competitor alternatives earlier in discussions
• Several long-standing accounts have formally requested service-level reviews

Root cause analysis points to systemic rather than isolated issues:
1. Centrally defined pricing corridors leave insufficient room for relationship-based adjustments
2. Capacity allocation optimized for efficiency limits ad-hoc flexibility for key accounts
3. Cross-functional coordination gaps between Retail planning, Logistics execution and IT systems

A detailed workshop protocol from the Commercial & Market Alignment session (January 27, Cologne) is available in the Data Room for further context.

Customer Escalation Desk
Varexia SE`
    },
    {
      id: "e13",
      from: "Rating Agency Exchange (Internal Summary)",
      subject: "Meeting Notes: Informal Exchange with Rating Agency",
      date: "Jan 28, 2026, 10:00 AM",
      read: true,
      important: false,
      content: `INTERNAL – CONFIDENTIAL

Summary of informal telephone exchange with Senior Director, European Corporates at a major rating agency. Approximately 30 minutes. No formal rating review.

Key takeaways:

1. Classification: No short-term rating action planned. However, increased internal attention on Varexia. Increasingly classified in peer comparison across retail/infrastructure/diversified groups.

2. Operative Performance: Assessed as stable. Revenue and EBITDA development generally positive. Portfolio diversification recognized.

3. Cash Flow Profile: Cash conversion (OCF/EBITDA) significantly below historical levels. Deviation from peers increasingly noticeable. Main drivers: front-loaded CAPEX, working capital absorption, inflexibility of leasing footprint. Individual effects explainable – cumulative effect relevant.

4. Capital Allocation: Strategic rationale behind individual investments comprehensible. However: uncertainty regarding priorities in conflicting objectives, explicit thresholds (e.g. net debt/EBITDA), and conditions for course corrections.

5. Key Quote: "Not the question of what you do – but under which conditions you would change course."

6. Outlook: No measures in short term. If cash flow pressure persists, increasing focus on net debt/EBITDA development over 12–18 months. Visibility of prioritization, consistency of communication, and governance quality becoming increasingly important.

Internal evaluation: No acute escalation. Perception: probationary phase, not crisis. External stakeholders expect clearer trade-offs.

Prepared by: Office of the CFO`
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

export const competencyFramework = {
  dimensions: [
    {
      key: "strategic_thinking",
      label: "Strategic Thinking",
      labelDe: "Strategisches Denken",
      description: "Ability to analyze complex situations, identify patterns, and develop coherent strategic perspectives",
      anchors: [
        { level: 1, text: "Focuses on isolated facts without connecting them to broader patterns" },
        { level: 2, text: "Identifies some connections but lacks a coherent overall perspective" },
        { level: 3, text: "Develops a structured view with clear priorities and logical reasoning" },
        { level: 4, text: "Integrates multiple perspectives into a nuanced, evidence-based strategic assessment" },
        { level: 5, text: "Exceptional ability to navigate ambiguity and synthesize complex, conflicting information into actionable insight" },
      ],
    },
    {
      key: "financial_acumen",
      label: "Financial Acumen",
      labelDe: "Finanzielle Kompetenz",
      description: "Understanding of financial data, cash flow dynamics, and capital allocation trade-offs",
      anchors: [
        { level: 1, text: "Limited understanding of financial indicators and their implications" },
        { level: 2, text: "Reads financial data but struggles with implications and trade-offs" },
        { level: 3, text: "Solid grasp of financial dynamics and their strategic implications" },
        { level: 4, text: "Deep understanding of financial interdependencies and capital allocation" },
        { level: 5, text: "Expert-level financial reasoning with sophisticated scenario thinking" },
      ],
    },
    {
      key: "stakeholder_management",
      label: "Stakeholder Management",
      labelDe: "Stakeholder-Management",
      description: "Ability to navigate diverse stakeholder interests and manage competing expectations",
      anchors: [
        { level: 1, text: "Ignores or oversimplifies stakeholder dynamics" },
        { level: 2, text: "Acknowledges stakeholders but does not address competing interests" },
        { level: 3, text: "Balances key stakeholder perspectives with clear reasoning" },
        { level: 4, text: "Proactively addresses stakeholder tensions and proposes realistic alignment strategies" },
        { level: 5, text: "Masterfully navigates complex stakeholder landscapes with political sensitivity and strategic empathy" },
      ],
    },
    {
      key: "decision_quality",
      label: "Decision Quality",
      labelDe: "Entscheidungsqualität",
      description: "Quality of judgment under uncertainty, willingness to make explicit trade-offs",
      anchors: [
        { level: 1, text: "Avoids decisions or makes choices without clear rationale" },
        { level: 2, text: "Makes decisions but does not address trade-offs explicitly" },
        { level: 3, text: "Makes well-reasoned decisions with explicit trade-off acknowledgment" },
        { level: 4, text: "Demonstrates strong judgment under uncertainty with clear prioritization logic" },
        { level: 5, text: "Exceptional decision-making that embraces complexity and makes courageous, well-substantiated choices" },
      ],
    },
    {
      key: "communication",
      label: "Communication & Presence",
      labelDe: "Kommunikation & Auftreten",
      description: "Clarity, structure, and persuasiveness of communication",
      anchors: [
        { level: 1, text: "Unclear or disorganized communication" },
        { level: 2, text: "Communicates key points but lacks structure or persuasiveness" },
        { level: 3, text: "Clear, structured communication with appropriate executive-level tone" },
        { level: 4, text: "Highly compelling and well-structured argumentation that engages the audience" },
        { level: 5, text: "Outstanding executive presence with masterful ability to frame complex issues accessibly" },
      ],
    },
    {
      key: "leadership_impact",
      label: "Leadership Impact",
      labelDe: "Führungswirkung",
      description: "Ability to inspire confidence, take ownership, and drive organizational clarity",
      anchors: [
        { level: 1, text: "Passive or hesitant in taking ownership of the situation" },
        { level: 2, text: "Shows some initiative but lacks conviction or follow-through" },
        { level: 3, text: "Takes clear ownership and demonstrates credible leadership stance" },
        { level: 4, text: "Inspires confidence through decisive action and thoughtful organizational perspective" },
        { level: 5, text: "Demonstrates transformational leadership potential with vision, courage, and authentic impact" },
      ],
    },
  ],
  ratingScale: { min: 1, max: 5, labels: ["Insufficient", "Basic", "Competent", "Strong", "Exceptional"] },
  ratingScaleDe: { min: 1, max: 5, labels: ["Unzureichend", "Grundlegend", "Kompetent", "Stark", "Herausragend"] },
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
