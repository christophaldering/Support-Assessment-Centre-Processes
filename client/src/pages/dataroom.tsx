import React, { useState } from "react";
import { varexiaData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Layers, ArrowUpRight, FolderOpen, TrendingDown, AlertTriangle, Users, Calendar, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DataRoom() {
  const [activeTab, setActiveTab] = useState("financials");
  const data = varexiaData;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2" data-testid="text-dataroom-title">Virtual Data Room</h1>
          <p className="text-muted-foreground">Repository of all provided internal and external documents</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-border text-muted-foreground bg-card">
          <FolderOpen className="w-3 h-3 mr-2" />
          Access Level: Executive
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-6 gap-4 flex-wrap">
          {[
            { value: "financials", label: "Financial Statements" },
            { value: "cashflow", label: "Cash Flow" },
            { value: "stress", label: "Stress Scenario" },
            { value: "business-units", label: "Business Units" },
            { value: "internal-docs", label: "Internal Documents" },
            { value: "corporate", label: "Corporate Governance" },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-foreground px-0 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="financials" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="font-serif">Year-over-Year Performance (2024 vs 2025)</CardTitle>
                <CardDescription>Comparative analysis of revenue and EBITDA growth across all business units</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Unit</TableHead>
                      <TableHead className="text-right">FY 2024 (EUR bn)</TableHead>
                      <TableHead className="text-right">FY 2025 (EUR bn)</TableHead>
                      <TableHead className="text-right">Delta YoY (EUR bn)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.businessUnits.map((bu) => (
                      <React.Fragment key={bu.id}>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-bold text-foreground" colSpan={4}>{bu.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-muted-foreground">Revenue</TableCell>
                          <TableCell className="text-right font-mono">{bu.yoy?.revenue}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{bu.financials.revenue}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">+{bu.yoy?.deltaRevenue}</TableCell>
                        </TableRow>
                        <TableRow className="border-b-2">
                          <TableCell className="pl-8 text-muted-foreground">EBITDA</TableCell>
                          <TableCell className="text-right font-mono">{bu.yoy?.ebitda}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{bu.financials.ebitda}</TableCell>
                          <TableCell className={`text-right font-mono ${bu.yoy?.deltaEbitda && bu.yoy.deltaEbitda < 0 ? 'text-red-600' : (bu.yoy?.deltaEbitda === 0 ? 'text-muted-foreground' : 'text-green-600')}`}>
                            {bu.yoy?.deltaEbitda && bu.yoy.deltaEbitda > 0 ? `+${bu.yoy.deltaEbitda}` : bu.yoy?.deltaEbitda}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="bg-muted/50 border-b border-border">
                  <CardTitle className="font-serif">Assets</CardTitle>
                  <CardDescription>Consolidated Balance Sheet FY 2025 (EUR Millions)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line Item</TableHead>
                        <TableHead className="text-right">Value (EUR mn)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold text-foreground/80" colSpan={2}>Non-Current Assets</TableCell>
                      </TableRow>
                      {data.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                        <TableRow key={item.item}>
                          <TableCell className="text-muted-foreground pl-8">{item.item}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted border-t-2 border-border">
                        <TableCell className="font-bold text-foreground">Total Non-Current Assets</TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">EUR 61,747.00</TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold text-foreground/80" colSpan={2}>Current Assets</TableCell>
                      </TableRow>
                      {data.detailedBalanceSheet.assets.current.map((item) => (
                        <TableRow key={item.item}>
                          <TableCell className="text-muted-foreground pl-8">{item.item}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted border-t-2 border-border">
                        <TableCell className="font-bold text-foreground">Total Current Assets</TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">EUR 17,993.00</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                        <TableCell className="font-bold">TOTAL ASSETS</TableCell>
                        <TableCell className="text-right font-bold font-mono">EUR 79,740.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-muted/50 border-b border-border">
                  <CardTitle className="font-serif">Equity & Liabilities</CardTitle>
                  <CardDescription>Consolidated Balance Sheet FY 2025 (EUR Millions)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line Item</TableHead>
                        <TableHead className="text-right">Value (EUR mn)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold text-foreground/80" colSpan={2}>Equity</TableCell>
                      </TableRow>
                      {data.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                        <TableRow key={item.item}>
                          <TableCell className="text-muted-foreground pl-8">{item.item}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted border-t-2 border-border">
                        <TableCell className="font-bold text-foreground">Total Equity</TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">EUR 21,904.00</TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold text-foreground/80" colSpan={2}>Non-Current Liabilities</TableCell>
                      </TableRow>
                      {data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                        <TableRow key={item.item}>
                          <TableCell className="text-muted-foreground pl-8">{item.item}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted border-t-2 border-border">
                        <TableCell className="font-bold text-foreground">Total Non-Current Liab.</TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">EUR 43,853.00</TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold text-foreground/80" colSpan={2}>Current Liabilities</TableCell>
                      </TableRow>
                      {data.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                        <TableRow key={item.item}>
                          <TableCell className="text-muted-foreground pl-8">{item.item}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted border-t-2 border-border">
                        <TableCell className="font-bold text-foreground">Total Current Liab.</TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">EUR 13,983.00</TableCell>
                      </TableRow>

                      <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                        <TableCell className="font-bold">TOTAL EQUITY & LIAB.</TableCell>
                        <TableCell className="text-right font-bold font-mono">EUR 79,740.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: "Operating Activities", items: data.cashFlow.operating },
              { title: "Investing Activities", items: data.cashFlow.investing },
              { title: "Financing Activities", items: data.cashFlow.financing },
              { title: "Cash Bridge", items: data.cashFlow.cashBridge },
            ].map(section => (
              <Card key={section.title}>
                <CardHeader className="bg-muted/50 border-b border-border">
                  <CardTitle className="font-serif text-lg">{section.title}</CardTitle>
                  <CardDescription>FY 2025 (EUR bn)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {section.items.map((item, i) => (
                        <TableRow key={i} className={item.isSubtotal ? "bg-muted font-bold border-t-2 border-border" : ""}>
                          <TableCell className={`${item.isSubtotal ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {item.item}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${item.isSubtotal ? "text-foreground font-bold" : ""} ${item.value < 0 ? "text-red-600" : ""}`}>
                            {item.value > 0 ? `+${item.value.toFixed(3)}` : item.value.toFixed(3)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.analystReport && (
            <Card className="border-accent/30">
              <CardHeader className="bg-accent/5 border-b border-accent/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">{data.analystReport.title}</CardTitle>
                    <CardDescription>{data.analystReport.source}</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-accent text-accent">External</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Key Observations</h4>
                  <ul className="space-y-2">
                    {data.analystReport.observations.map((obs, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-1">-</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.analystReport.financialIndicators.map((ind, i) => (
                    <div key={i} className="bg-muted/50 rounded p-3 border border-border">
                      <span className="text-xs text-muted-foreground uppercase block">{ind.label}</span>
                      <span className="text-lg font-mono font-bold text-foreground">{ind.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-accent/5 border border-accent/20 rounded p-4 text-sm text-foreground italic">
                  {data.analystReport.conclusion}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stress" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-amber-200">
            <CardHeader className="bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="font-serif text-foreground">{data.stressScenario.title}</CardTitle>
                  <CardDescription className="text-amber-700">{data.stressScenario.subtitle}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">EUR bn</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stressScenario.items.map((item, i) => (
                    <TableRow key={i} className={item.isSubtotal ? "bg-amber-50 font-bold border-t-2 border-amber-200" : ""}>
                      <TableCell className={item.isSubtotal ? "font-bold text-foreground" : "text-muted-foreground"}>
                        {item.item}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${item.isSubtotal ? "font-bold" : ""} ${item.value < 0 ? "text-red-600" : ""}`}>
                        {item.value > 0 ? `+${item.value.toFixed(2)}` : item.value.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{item.comment}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Key Drivers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {data.stressScenario.keyDrivers.map((d, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-500 mt-1 shrink-0">-</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Implications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {data.stressScenario.implications.map((imp, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-1 shrink-0">-</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business-units" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.businessUnits.map((bu) => (
              <Card key={bu.id} className="hover:border-accent/40 transition-colors" data-testid={`card-bu-${bu.id}`}>
                <CardHeader className="bg-muted/50 border-b border-border pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-serif text-foreground">{bu.name}</CardTitle>
                      <CardDescription className="text-xs uppercase tracking-wider mt-1">Business Unit Profile</CardDescription>
                    </div>
                    <Layers className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Revenue</span>
                      <div className="text-2xl font-mono font-medium text-foreground">EUR {bu.financials.revenue}bn</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">EBITDA Margin</span>
                      <div className={`text-2xl font-mono font-medium ${bu.financials.margin > 10 ? 'text-green-700' : 'text-foreground'}`}>
                        {bu.financials.margin}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded border border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Key Performance Indicators</span>
                    <ul className="space-y-1">
                      {bu.kpis.map((kpi, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                          <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                          {kpi}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-3 rounded border border-amber-100 text-amber-900">
                    <span className="text-xs font-bold uppercase block mb-1 text-amber-700">Strategic Tension</span>
                    <p className="text-sm italic">"{bu.tension}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="internal-docs" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Pulse Survey */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    {data.pulseSurvey.title}
                  </CardTitle>
                  <CardDescription>
                    {data.pulseSurvey.participants} participants | {data.pulseSurvey.responseRate}% response rate | Scale: {data.pulseSurvey.scale}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-accent text-accent">HR / Confidential</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {data.pulseSurvey.sections.map((section, si) => (
                <div key={si}>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">{section.name}</h4>
                  <div className="space-y-2">
                    {section.items.map((item, ii) => (
                      <div key={ii} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground flex-1">{item.statement}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.score <= 2.0 ? 'bg-red-400' : item.score <= 2.5 ? 'bg-amber-400' : item.score <= 3.0 ? 'bg-yellow-400' : 'bg-green-400'}`}
                              style={{ width: `${(item.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`font-mono text-sm font-bold w-8 text-right ${item.score <= 2.0 ? 'text-red-600' : item.score <= 2.5 ? 'text-amber-600' : 'text-foreground'}`}>
                            {item.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-muted/50 rounded border border-border p-4 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Selected Verbatim Comments</h4>
                {data.pulseSurvey.comments.map((c, i) => (
                  <p key={i} className="text-sm text-foreground/80 italic border-l-2 border-accent/30 pl-3">"{c}"</p>
                ))}
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded p-4">
                <span className="text-xs font-bold text-accent uppercase block mb-1">HR Assessment</span>
                <p className="text-sm text-foreground">{data.pulseSurvey.hrComment}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Agency Notes */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif">{data.ratingAgencyNotes.title}</CardTitle>
                  <CardDescription>{data.ratingAgencyNotes.date} | {data.ratingAgencyNotes.format}</CardDescription>
                </div>
                <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Confidential</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {[
                { title: "Classification", items: data.ratingAgencyNotes.classification },
                { title: "Operative Performance", items: data.ratingAgencyNotes.operativePerformance },
                { title: "Cash Flow Profile", items: data.ratingAgencyNotes.cashFlowProfile },
                { title: "Capital Allocation", items: data.ratingAgencyNotes.capitalAllocation },
                { title: "Expectations (12-18 months)", items: data.ratingAgencyNotes.expectations },
              ].map((section, i) => (
                <div key={i}>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-100 rounded p-4">
                <span className="text-xs font-bold text-amber-700 uppercase block mb-1">Key Quote</span>
                <p className="text-sm text-amber-900 italic">"{data.ratingAgencyNotes.quote}"</p>
              </div>
              <div className="bg-muted/50 rounded p-3 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Internal Evaluation</span>
                <p className="text-sm text-foreground">{data.ratingAgencyNotes.internalEvaluation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Workshop Protocol */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-accent" />
                    {data.workshopProtocol.title}
                  </CardTitle>
                  <CardDescription>{data.workshopProtocol.date} | {data.workshopProtocol.location}</CardDescription>
                </div>
                <Badge variant="outline">Internal</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground italic">{data.workshopProtocol.context}</p>
              {data.workshopProtocol.sections.map((s, i) => (
                <div key={i} className="border-l-2 border-accent/20 pl-4">
                  <h4 className="text-sm font-bold text-foreground mb-2">{s.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lessons Learned */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="font-serif">{data.lessonsLearnedSpeech.title}</CardTitle>
              <CardDescription>{data.lessonsLearnedSpeech.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {data.lessonsLearnedSpeech.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="text-sm font-bold text-foreground mb-1">{s.heading}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground italic border-t border-border pt-3">{data.lessonsLearnedSpeech.footer}</p>
            </CardContent>
          </Card>

          {/* Digital Steering Committee */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    {data.digitalSteeringCommittee.title}
                  </CardTitle>
                  <CardDescription>{data.digitalSteeringCommittee.date} | Duration: {data.digitalSteeringCommittee.duration}</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">Status: Amber</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Status", value: data.digitalSteeringCommittee.status },
                  { label: "Timeline", value: data.digitalSteeringCommittee.timeline },
                  { label: "Budget Util.", value: data.digitalSteeringCommittee.budgetUtilization },
                  { label: "Business Case", value: data.digitalSteeringCommittee.businessCase },
                ].map((m, i) => (
                  <div key={i} className="bg-muted/50 rounded p-3 border border-border">
                    <span className="text-xs text-muted-foreground uppercase block">{m.label}</span>
                    <span className="text-sm font-bold text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-2">Agenda: {data.digitalSteeringCommittee.agendaItem}</h4>
                <p className="text-sm text-muted-foreground">{data.digitalSteeringCommittee.discussion}</p>
              </div>
              <div className="bg-muted/50 rounded p-3 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Decisions</span>
                <p className="text-sm text-foreground">{data.digitalSteeringCommittee.decisions}</p>
              </div>
              <div className="bg-muted/50 rounded p-3 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Action Items</span>
                <p className="text-sm text-foreground">{data.digitalSteeringCommittee.actionItems}</p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Workshop */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="font-serif">{data.leadershipWorkshop.title}</CardTitle>
              <CardDescription>{data.leadershipWorkshop.subtitle} | {data.leadershipWorkshop.date} | {data.leadershipWorkshop.location}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {[
                { title: "Situation Assessment", items: data.leadershipWorkshop.situationAssessment },
                { title: "Structural Tensions", items: data.leadershipWorkshop.structuralTensions },
                { title: "Organizational Response", items: data.leadershipWorkshop.organizationalResponse },
                { title: "Emerging Risks", items: data.leadershipWorkshop.emergingRisks },
                { title: "Core Insight", items: data.leadershipWorkshop.coreInsight },
              ].map((section, i) => (
                <div key={i}>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="bg-accent/5 border border-accent/20 rounded p-4">
                <span className="text-xs font-bold text-accent uppercase block mb-1">Implication</span>
                <p className="text-sm text-foreground">{data.leadershipWorkshop.implication}</p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Conference & Board Meeting Impressions */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="font-serif">{data.leadershipConference.title}</CardTitle>
              <CardDescription>{data.leadershipConference.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.leadershipConference.content}</p>
            </CardContent>
          </Card>

          {data.boardMeetingImpressions.map((bm, i) => (
            <Card key={i}>
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="font-serif text-lg">{bm.title}</CardTitle>
                <CardDescription>Board Meeting Impression</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{bm.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="corporate" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Structure & Governance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="text-lg font-medium text-foreground mb-2">Organization</h3>
                   <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                     <li><strong>Legal Form:</strong> European Stock Corporation (SE)</li>
                     <li><strong>Management Structure:</strong> Dual Board (Management Board + Supervisory Board)</li>
                     <li><strong>Headquarters:</strong> Europe</li>
                     <li><strong>Listing:</strong> Publicly Listed</li>
                   </ul>
                </div>
                <div>
                   <h3 className="text-lg font-medium text-foreground mb-2">Key Figures</h3>
                   <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                     <li><strong>Total Employees:</strong> 284,000 FTE</li>
                     <li><strong>Market Cap:</strong> EUR 28.7 bn (Significant recent decline)</li>
                     <li><strong>Group Revenue:</strong> EUR 42.0 bn</li>
                     <li><strong>Group EBIT:</strong> EUR 1.4 bn</li>
                   </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
