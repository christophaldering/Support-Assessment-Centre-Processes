export interface ContentSection {
  heading: string;
  body: string;
}

export interface ModuleContent {
  id: string;
  title: string;
  subtitle: string;
  sections: ContentSection[];
  ctaLabel?: string;
  ctaHref?: string;
  backLabel?: string;
  backHref?: string;
}

export const welcomeContent: ModuleContent = {
  id: "welcome",
  title: "Welcome to Your Assessment",
  subtitle: "Varexia SE — Executive Assessment Center",
  sections: [
    {
      heading: "Dear Candidate,",
      body: "We are pleased to welcome you to the executive assessment for the Chief Strategy Officer (CSO) position at Varexia SE. This assessment has been designed to evaluate your strategic thinking, analytical capabilities, and leadership presence in a realistic business context.",
    },
    {
      heading: "What to Expect",
      body: "Over the course of this assessment, you will engage with three core exercises. Each exercise is built around the Varexia SE case study — a publicly listed European conglomerate facing significant strategic, financial, and organizational challenges. You will have access to a comprehensive data room containing all relevant background materials.",
    },
    {
      heading: "Exercise Overview",
      body: "The assessment consists of three modules:\n\n1. **Presentation Task** — Prepare and deliver a strategic analysis and turnaround recommendation for the Varexia Supervisory Board.\n\n2. **Simulated Employee Conversation** — Conduct a structured dialogue with a senior stakeholder navigating organizational tension.\n\n3. **Data Room** — Access all case materials including financial reports, internal communications, analyst assessments, and organizational documents.",
    },
    {
      heading: "Preparation Guidelines",
      body: "We recommend starting with the Data Room to familiarize yourself with the Varexia case. Take time to understand the company's portfolio structure, financial position, and the key tensions across business units. The materials are designed to be comprehensive — focus on identifying the most strategically relevant information rather than reading every document in full.",
    },
    {
      heading: "Assessment Criteria",
      body: "You will be evaluated on the following dimensions:\n\n• **Strategic Depth** — Ability to analyze complex, multi-layered business situations\n• **Financial Acumen** — Understanding of financial drivers, trade-offs, and capital allocation\n• **Decision Quality** — Willingness to make explicit trade-offs under uncertainty\n• **Communication** — Clarity, structure, and persuasiveness of your argumentation\n• **Leadership Presence** — Composure, empathy, and authenticity in interpersonal settings",
    },
    {
      heading: "Logistics",
      body: "Please ensure you have reviewed all materials before your scheduled assessment date. If you have any technical difficulties accessing the portal or its content, please contact the assessment administration team. We wish you every success in this process.",
    },
  ],
  ctaLabel: "Continue to Home",
  ctaHref: "/candidate/home",
};

export const presentationContent: ModuleContent = {
  id: "presentation",
  title: "Presentation Task",
  subtitle: "Strategic Analysis & Board Recommendation",
  sections: [
    {
      heading: "Situational Context",
      body: "Varexia SE is a publicly listed European conglomerate with €42 billion in revenue, operating across four business divisions: Retail & Consumer Goods, Logistics & Supply Chain, Energy & Infrastructure, and Digital Services & Consulting. The company employs approximately 284,000 people and has a current market capitalization of €28.7 billion — down from €38.2 billion eighteen months ago.",
    },
    {
      heading: "Your Role",
      body: "You have been engaged as an external candidate for the position of Chief Strategy Officer (CSO). The Supervisory Board has requested a comprehensive strategic review and expects you to present a clear, actionable turnaround strategy. Your presentation will be delivered to members of the Supervisory Board.",
    },
    {
      heading: "Task Description",
      body: "Prepare a 20-minute presentation that addresses the following:\n\n1. **Situation Assessment** — Analyze the current strategic, financial, and organizational position of Varexia SE. Identify the root causes of declining performance and investor confidence.\n\n2. **Portfolio Strategy** — Evaluate each of the four business divisions. Recommend a clear portfolio logic with explicit prioritization — which businesses should be invested in, restructured, or divested?\n\n3. **Financial Recovery** — Propose concrete measures to stabilize free cash flow, reduce leverage, and address the covenant breach risk within 12–18 months.\n\n4. **Organizational & Leadership Recommendations** — Address the structural tensions in governance, incentive systems, and decision-making authority that are undermining operational effectiveness.\n\n5. **Implementation Roadmap** — Outline a sequenced action plan with clear milestones, accountability, and success metrics.",
    },
    {
      heading: "Expectations",
      body: "The Supervisory Board expects strategic clarity, not consensus solutions. You should demonstrate:\n\n• The ability to synthesize complex, sometimes contradictory information\n• Willingness to make explicit trade-offs and defend difficult decisions\n• A clear logic for resource allocation and portfolio prioritization\n• Understanding of the financial implications of your recommendations\n• Awareness of implementation risks and stakeholder management requirements",
    },
    {
      heading: "Preparation Hints",
      body: "• Start with the Data Room — review the financial data, internal communications, and analyst assessments\n• Pay particular attention to the tensions between business units and the gap between reported earnings and cash generation\n• Consider the perspectives of different stakeholders: Supervisory Board, management, employees, investors, and analysts\n• Structure your presentation clearly — the Board values precision over volume\n• Be prepared for critical questions on your assumptions and trade-offs",
    },
    {
      heading: "Format & Timing",
      body: "• **Preparation time:** 60 minutes\n• **Presentation:** 20 minutes\n• **Q&A with the Board:** 10 minutes\n• You may use slides, a whiteboard, or a structured verbal presentation\n• All data room materials will remain accessible during preparation",
    },
  ],
  ctaLabel: "Open Data Room",
  ctaHref: "/candidate/data-room",
  backLabel: "Back to Home",
  backHref: "/candidate/home",
};

export const conversationContent: ModuleContent = {
  id: "conversation",
  title: "Simulated Employee Conversation",
  subtitle: "Structured Leadership Dialogue",
  sections: [
    {
      heading: "Context",
      body: "As part of the assessment, you will conduct a simulated one-on-one conversation with a senior leader within the Varexia organization. This exercise is designed to evaluate your interpersonal leadership capabilities, your ability to navigate organizational tension, and your capacity to build trust while maintaining strategic clarity.",
    },
    {
      heading: "Role Constellation",
      body: "**Your Role:** You are the newly appointed Chief Strategy Officer (CSO) of Varexia SE. You have been in the role for approximately four weeks and are still building relationships across the organization.\n\n**Your Counterpart:** Lars Nielsen, CEO of the Logistics & Supply Chain Division. Lars has been with Varexia for 12 years and is widely respected for his operational expertise. He leads a division of 55,000 employees generating €8.0 billion in revenue.",
    },
    {
      heading: "Situation",
      body: "Lars has requested an urgent meeting with you. His division's capital budget is under threat due to a Group-wide CAPEX review. The Logistics division requires significant investment in automation — currently 40% of operations remain semi-manual. Without this investment, Lars estimates a 15% increase in cost per case within 12 months.\n\nAt the same time, the Group is under pressure to reduce leverage and improve free cash flow. The CFO has signaled that all non-essential capital expenditure may be frozen. Lars feels his division is being unfairly penalized to cover for underperformance elsewhere in the Group.",
    },
    {
      heading: "Objectives",
      body: "In this conversation, you should aim to:\n\n1. **Understand Lars's perspective** — Listen actively and demonstrate genuine interest in his concerns about the division's competitive position.\n\n2. **Acknowledge the tension** — Recognize the legitimate conflict between division-level investment needs and Group-level financial constraints.\n\n3. **Explore solutions** — Work collaboratively toward a path forward that balances short-term financial discipline with long-term strategic investment.\n\n4. **Maintain your strategic authority** — While being empathetic, do not make promises you cannot keep or undermine the Group's financial discipline.\n\n5. **Build the relationship** — Use this conversation to establish trust and credibility with a key senior stakeholder.",
    },
    {
      heading: "Key Tensions to Navigate",
      body: "• **Division autonomy vs. Group discipline:** Lars believes divisional leaders should have more control over their investment budgets. The Group perspective requires coordinated capital allocation.\n\n• **Short-term vs. long-term:** Freezing CAPEX saves cash today but may destroy competitive position tomorrow. How do you balance these time horizons?\n\n• **Fairness perception:** Lars may argue that his division generates reliable cash flow and should not bear the consequences of challenges in other units (particularly Digital Services).\n\n• **Emotional dynamics:** Lars is frustrated, possibly feeling unheard. He may test whether you are truly listening or simply executing a predetermined decision.\n\n• **Information asymmetry:** You have access to the full Group picture including covenant risks and analyst concerns. Lars may not have the same visibility.",
    },
    {
      heading: "Format & Timing",
      body: "• **Preparation time:** 10 minutes\n• **Conversation duration:** 20 minutes\n• **Debrief/Reflection:** 5 minutes\n• The conversation will be conducted with a trained role player\n• Focus on the quality of the dialogue, not on reaching a specific outcome",
    },
  ],
  ctaLabel: "Open Data Room",
  ctaHref: "/candidate/data-room",
  backLabel: "Back to Home",
  backHref: "/candidate/home",
};

export const allModules = [welcomeContent, presentationContent, conversationContent];
