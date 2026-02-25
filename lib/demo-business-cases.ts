export interface DemoSlide {
  title: string;
  body: string;
  kpis?: string[];
}

export interface DemoCase {
  slides: DemoSlide[];
}

const cases: Record<string, DemoCase> = {
  Amsterdam: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Amsterdam verfolgt eine konsequente Wachstumsstrategie mit Fokus auf nachhaltige Marktdurchdringung in der DACH-Region. Die zentrale These: Qualitatives Wachstum schlägt quantitatives Wachstum – eine Überzeugung, die Elizabeth Bennet mit einer Beharrlichkeit vertrat, die selbst Mr. Darcy beeindruckt hätte.",
        kpis: ["Marktanteil DACH: +8% in 3 Jahren", "Kundenbindungsrate: >92%", "NPS-Zielwert: 72"],
      },
      {
        title: "Marktanalyse",
        body: "Die Wettbewerbslandschaft wurde mit forensischer Gründlichkeit kartiert – Sherlock Holmes hätte seine helle Freude an der Detailtiefe gehabt. Drei strategische Lücken im Wettbewerbsumfeld wurden identifiziert, die signifikantes Potenzial für differenzierte Positionierung bieten.",
        kpis: ["TAM: €4,2 Mrd.", "SAM: €890 Mio.", "Wettbewerber analysiert: 14"],
      },
      {
        title: "Geschäftsmodell",
        body: "Das Geschäftsmodell basiert auf einem Plattform-Ökosystem mit drei Ertragssäulen: Kernprodukt (SaaS), Beratungsleistungen und strategische Partnerschaften. Die Unit Economics sind durchgehend belastbar und zeigen einen klaren Pfad zur Profitabilität.",
        kpis: ["CAC: €2.400", "LTV: €18.600", "LTV/CAC Ratio: 7,75x", "Gross Margin: 78%"],
      },
      {
        title: "Finanzplanung",
        body: "Die Fünf-Jahres-Planung zeigt einen konservativen Wachstumspfad mit realistischen Annahmen. Break-Even wird in Q3 des dritten Jahres erreicht. Die Sensitivitätsanalyse berücksichtigt drei Szenarien – wobei selbst das pessimistische Szenario noch operativ tragfähig bleibt.",
        kpis: ["Revenue Y1: €12,4 Mio.", "Revenue Y5: €67,8 Mio.", "EBITDA-Marge Y5: 24%", "Investitionsbedarf: €8,5 Mio."],
      },
      {
        title: "Risikoanalyse",
        body: "Das Risikomanagement umfasst regulatorische, technologische und marktbezogene Risiken. Für jedes der acht identifizierten Kernrisiken wurden konkrete Mitigationsstrategien entwickelt. Dr. Watson kommentierte trocken, dass dies die einzige Präsentation sei, bei der die Risikoanalyse spannender war als der Kriminalroman.",
        kpis: ["Identifizierte Risiken: 8", "Mitigiert: 8/8", "Residualrisiko: niedrig-mittel"],
      },
    ],
  },
  Barcelona: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Barcelona setzt auf internationale Expansion mit einem Fokus auf südeuropäische Märkte. Die Strategie verbindet lokale Marktkenntnis mit skalierbarer Technologie. Anna Karenina brachte eine leidenschaftliche Perspektive ein – mit gelegentlichen existenziellen Zwischentönen.",
        kpis: ["Zielmärkte: 5 Länder", "Expansion Timeline: 24 Monate", "Markenbekanntheit: +35%"],
      },
      {
        title: "Marktanalyse",
        body: "Die Analyse zeigt fragmentierte Märkte mit signifikantem Konsolidierungspotenzial. Gregor Samsa verwandelte die trockenen Marktdaten in überraschend lebendige Visualisierungen – eine Metamorphose, die dem Team sichtlich guttat.",
        kpis: ["Marktfragmentierung: hoch", "Top-3-Wettbewerber: 28% Marktanteil", "Konsolidierungspotenzial: €1,8 Mrd."],
      },
      {
        title: "Geschäftsmodell",
        body: "Ein Franchise-Modell mit zentraler Technologieplattform. Don Quijote verteidigte die Vision mit unbeirrbarer Überzeugung gegen alle Windmühlen der Realität – und brachte damit eine erfrischende Perspektive in die sonst nüchterne Geschäftsmodell-Diskussion.",
        kpis: ["Franchise-Fee: 12%", "Zentrale Marge: 45%", "Break-Even pro Standort: 14 Monate"],
      },
      {
        title: "Finanzplanung",
        body: "Die Finanzplanung ist ambitioniert, aber nicht unrealistisch. Sancho Panza sorgte als zuverlässiger Finanzstratege dafür, dass die Zahlen auf dem Boden blieben, während Don Quijote gelegentlich nach den Sternen griff.",
        kpis: ["Revenue Y1: €8,9 Mio.", "Revenue Y5: €52,3 Mio.", "EBITDA-Marge Y5: 19%", "Investitionsbedarf: €11,2 Mio."],
      },
      {
        title: "Risikoanalyse",
        body: "Regulatorische Komplexität in mehreren Jurisdiktionen stellt das Hauptrisiko dar. Das Team zeigte pragmatische Lösungsansätze, wenngleich die Risikobereitschaft höher lag als beim Wettbewerb – ein kalkuliertes Spiel, das Mut und Weitblick erfordert.",
        kpis: ["Regulatorische Risiken: 6", "Marktrisiken: 4", "Technologierisiken: 3"],
      },
    ],
  },
  Berlin: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Berlin präsentierte eine datengetriebene Strategie mit klarem Fokus auf operative Exzellenz. Die These: Effizienz als strategischer Wettbewerbsvorteil. Jay Gatsby hätte es nicht besser inszenieren können – nur dass hier die Substanz der Show überlegen war.",
        kpis: ["Effizienzsteigerung: 34%", "Automatisierungsgrad: 78%", "Time-to-Market: -40%"],
      },
      {
        title: "Marktanalyse",
        body: "Atticus Finch führte die Marktanalyse mit der Präzision eines Plädoyers. Jede These wurde belegt, jedes Gegenargument antizipiert. Die Wettbewerbsanalyse war so gründlich, dass selbst der stärkste Konkurrent darin sein Spiegelbild erkennen würde.",
        kpis: ["Marktwachstum: 12% p.a.", "Eintrittsbarrieren: mittel-hoch", "First-Mover-Vorteil: 18 Monate"],
      },
      {
        title: "Geschäftsmodell",
        body: "Das B2B-SaaS-Modell überzeugt durch starke Unit Economics und einen klaren Pfad zur Skalierung. Hermione Granger brachte eine analytische Schärfe ein, die das Modell von allen Seiten durchleuchtete – keine Annahme blieb ungeprüft.",
        kpis: ["ARR Y1: €6,8 Mio.", "Net Revenue Retention: 118%", "Payback Period: 11 Monate", "Rule of 40: 52"],
      },
      {
        title: "Finanzplanung",
        body: "Die Finanzplanung besticht durch konservative Annahmen mit aggressivem Upside-Potenzial. Jedes Szenario wurde durchgerechnet, jede Sensitivität getestet. Die Zahlenlogik ist durchgängig belastbar.",
        kpis: ["Revenue Y1: €14,2 Mio.", "Revenue Y5: €78,5 Mio.", "EBITDA-Marge Y5: 28%", "Cash-Flow-positiv: Q2 Y3"],
      },
      {
        title: "Risikoanalyse",
        body: "Das Risikomanagement ist systematisch und umfassend. Jean Valjean brachte die ethische Dimension ein, während Cosette die regulatorischen Details mit überraschender Souveränität navigierte. Kein Risiko wurde beschönigt, jede Mitigation ist konkret und umsetzbar.",
        kpis: ["Risiko-Score gesamt: 2,4/5", "Kritische Risiken: 1", "Mitigationsabdeckung: 100%"],
      },
    ],
  },
  Kopenhagen: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Kopenhagen setzte auf nachhaltiges Wachstum mit skandinavischer Effizienz. Die Strategie vereint ESG-Führerschaft mit profitablem Wachstum – ein Ansatz, der zunehmend zum Wettbewerbsvorteil wird.",
        kpis: ["ESG-Rating Ziel: AAA", "Nachhaltigkeitsindex: Top 10%", "Carbon Neutral: bis Y3"],
      },
      {
        title: "Marktanalyse",
        body: "Die Marktanalyse fokussiert auf den wachsenden Markt für nachhaltige Unternehmensdienstleistungen. Der Trend ist eindeutig: Nachhaltigkeit wird vom Nice-to-have zum Must-have. Die Datenbasis ist solide, wenngleich die Prognosen optimistisch ausfallen.",
        kpis: ["Marktgröße: €3,1 Mrd.", "Wachstum: 18% p.a.", "Regulatorischer Rückenwind: stark"],
      },
      {
        title: "Geschäftsmodell",
        body: "Ein Plattform-Modell mit Subscription-Basis und Impact-basierter Preisgestaltung. Innovative Pricing-Ansätze, die den Kunden an den erzielten Nachhaltigkeitserfolgen beteiligen.",
        kpis: ["Subscription Revenue: 70%", "Impact-Based Revenue: 20%", "Consulting: 10%", "Churn Rate: <5%"],
      },
      {
        title: "Finanzplanung",
        body: "Die Finanzplanung zeigt einen soliden Wachstumspfad mit bewusst konservativen Annahmen. Die Investitionsphase ist klar definiert, der Break-Even realistisch terminiert.",
        kpis: ["Revenue Y1: €9,6 Mio.", "Revenue Y5: €58,2 Mio.", "EBITDA-Marge Y5: 22%", "Investitionsbedarf: €7,8 Mio."],
      },
      {
        title: "Risikoanalyse",
        body: "Hauptrisiken liegen in der regulatorischen Dynamik und der Abhängigkeit von ESG-Frameworks. Das Team zeigte Bewusstsein für die Risiken, könnte die Mitigationsstrategien jedoch noch konkreter ausarbeiten.",
        kpis: ["Regulatorische Risiken: 5", "Marktrisiken: 3", "Reputationsrisiken: 2"],
      },
    ],
  },
  Mailand: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Mailand verfolgt eine Luxus-Positionierungsstrategie im B2B-Segment. Premium-Qualität als Differenzierungsmerkmal in einem zunehmend commoditisierten Markt. Odysseus navigierte sein Team mit beinahe homerischer Weitsicht durch die strategischen Untiefen.",
        kpis: ["Premium-Aufschlag: 40%", "Markenwahrnehmung: Top 3", "Kundenloyalität: 95%"],
      },
      {
        title: "Marktanalyse",
        body: "Die Analyse des Premium-Segments zeigt stabile Nachfrage trotz wirtschaftlicher Volatilität. Penelope lieferte eine beeindruckend detaillierte Wettbewerbsanalyse, die das Warten auf die richtigen Marktbedingungen als strategische Stärke positionierte.",
        kpis: ["Premium-Marktsegment: €2,4 Mrd.", "Wachstum Premium: 8% p.a.", "Preiselastizität: niedrig"],
      },
      {
        title: "Geschäftsmodell",
        body: "Ein High-Touch-Modell mit persönlicher Beratung und maßgeschneiderten Lösungen. Hamlet überraschte mit decisiven Beiträgen zur Produktstrategie – sein übliches Zögern war in der Hitze der Präsentation vergessen.",
        kpis: ["ACV: €85.000", "Sales Cycle: 6 Monate", "Win Rate: 38%", "Expansion Rate: 125%"],
      },
      {
        title: "Finanzplanung",
        body: "Die Finanzplanung reflektiert den längeren Sales-Cycle des Premium-Segments. Ophelia brachte eine überraschende Nüchternheit in die Finanzmodellierung, die dem Team zugutekam. Die Margen sind attraktiv, das Wachstum organisch.",
        kpis: ["Revenue Y1: €11,8 Mio.", "Revenue Y5: €62,4 Mio.", "EBITDA-Marge Y5: 31%", "Investitionsbedarf: €6,5 Mio."],
      },
      {
        title: "Risikoanalyse",
        body: "Hauptrisiken: Konjunkturabhängigkeit des Premium-Segments und Talentgewinnung. Huckleberry Finn brachte eine erfrischend unkomplizierte Perspektive auf das Risikomanagement ein – manchmal ist der direkteste Weg auch der beste.",
        kpis: ["Konjunkturrisiko: mittel", "Talentrisiko: hoch", "Technologierisiko: niedrig", "Mitigationsplan: vollständig"],
      },
    ],
  },
  Paris: {
    slides: [
      {
        title: "Strategische Vision",
        body: "Team Paris setzte auf disruptive Innovation mit einem kreativ-strategischen Ansatz. Winston Smith brachte eine systemkritische Perspektive ein, die das Team zwang, jede Annahme zu hinterfragen – Big Brother würde diese Transparenz begrüßen.",
        kpis: ["Innovationsindex: 9,2/10", "Time-to-Market: 8 Monate", "Patent-Pipeline: 4 Anmeldungen"],
      },
      {
        title: "Marktanalyse",
        body: "Clarissa Dalloway orchestrierte die Marktanalyse mit einer Eleganz, die an einen perfekt choreografierten Salon erinnerte. Die Daten wurden nicht nur präsentiert, sondern inszeniert – wobei die Substanz durchaus mit der Form Schritt hielt.",
        kpis: ["Disruptionspotenzial: hoch", "Marktreife: 60%", "Early Adopter Segment: €1,6 Mrd."],
      },
      {
        title: "Geschäftsmodell",
        body: "Ein Freemium-Modell mit Community-getriebener Wachstumsstrategie. Gandalf bewies einmal mehr, dass ein weiser Berater den Unterschied machen kann – auch ohne Zauberstab. Die Conversion-Rates basieren auf vergleichbaren Community-Modellen.",
        kpis: ["Freemium Users Y1: 50.000", "Conversion Rate: 4,2%", "ARPU Premium: €1.200/Jahr", "Viral Coefficient: 1,4"],
      },
      {
        title: "Finanzplanung",
        body: "Die Finanzplanung spiegelt den J-Curve-Effekt des Freemium-Modells wider. Holden Caulfield kommentierte die Zahlen mit der ihm eigenen Skepsis – was durchaus zu einer gesunden Diskussion der Annahmen führte.",
        kpis: ["Revenue Y1: €7,2 Mio.", "Revenue Y5: €48,6 Mio.", "EBITDA-Marge Y5: 18%", "Investitionsbedarf: €14,8 Mio."],
      },
      {
        title: "Risikoanalyse",
        body: "Das Hauptrisiko liegt in der Abhängigkeit von Netzwerkeffekten und der höheren Investitionsphase. Das Team zeigte kreative Ansätze zur Risikominimierung, wobei die Execution-Risiken noch stärker adressiert werden sollten.",
        kpis: ["Netzwerkrisiko: hoch", "Finanzierungsrisiko: mittel-hoch", "Technologierisiko: mittel", "Kreativkapital: unbezahlbar"],
      },
    ],
  },
};

export function getDemoCase(teamDisplayName: string): DemoCase {
  return cases[teamDisplayName] || {
    slides: [
      {
        title: "Business Case",
        body: `Kein Business Case für "${teamDisplayName}" verfügbar.`,
      },
    ],
  };
}
