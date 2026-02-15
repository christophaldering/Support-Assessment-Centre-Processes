import React, { useState } from "react";
import { varexiaData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Layers, ArrowUpRight, FolderOpen } from "lucide-react";

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
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Virtual Data Room</h1>
          <p className="text-slate-500">Repository of all provided internal and external documents</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-slate-300 text-slate-600 bg-white">
          <FolderOpen className="w-3 h-3 mr-2" />
          Access Level: Executive
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 mb-6 gap-6">
          <TabsTrigger 
            value="financials" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 px-0 py-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Financial Statements (FY 2025)
          </TabsTrigger>
          <TabsTrigger 
            value="business-units" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 px-0 py-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Business Unit Deep Dive
          </TabsTrigger>
          <TabsTrigger 
            value="corporate" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 px-0 py-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Corporate Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="font-serif">Year-over-Year Performance (2024 vs 2025)</CardTitle>
                <CardDescription>Comparative analysis of revenue and EBITDA growth across all business units</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Unit</TableHead>
                      <TableHead className="text-right">FY 2024 (€ bn)</TableHead>
                      <TableHead className="text-right">FY 2025 (€ bn)</TableHead>
                      <TableHead className="text-right">Delta YoY (€ bn)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.businessUnits.map((bu) => (
                      <React.Fragment key={bu.id}>
                        <TableRow className="bg-slate-50/50">
                          <TableCell className="font-bold text-slate-900" colSpan={4}>{bu.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-slate-600">Revenue</TableCell>
                          <TableCell className="text-right font-mono">{bu.yoy?.revenue}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{bu.financials.revenue}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">+{bu.yoy?.deltaRevenue}</TableCell>
                        </TableRow>
                        <TableRow className="border-b-2">
                          <TableCell className="pl-8 text-slate-600">EBITDA</TableCell>
                          <TableCell className="text-right font-mono">{bu.yoy?.ebitda}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{bu.financials.ebitda}</TableCell>
                          <TableCell className={`text-right font-mono ${bu.yoy?.deltaEbitda && bu.yoy.deltaEbitda < 0 ? 'text-red-600' : (bu.yoy?.deltaEbitda === 0 ? 'text-slate-400' : 'text-green-600')}`}>
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
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="font-serif">Assets</CardTitle>
                <CardDescription>Consolidated Balance Sheet FY 2025 (€ Millions)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line Item</TableHead>
                      <TableHead className="text-right">Value (€ mn)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700" colSpan={2}>Non-Current Assets</TableCell>
                    </TableRow>
                    {data.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="text-slate-600 pl-8">{item.item}</TableCell>
                        <TableCell className="text-right font-mono text-slate-900">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 border-t-2 border-slate-200">
                      <TableCell className="font-bold text-slate-900">Total Non-Current Assets</TableCell>
                      <TableCell className="text-right font-bold font-mono text-slate-900">€61,747.00</TableCell>
                    </TableRow>

                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700" colSpan={2}>Current Assets</TableCell>
                    </TableRow>
                    {data.detailedBalanceSheet.assets.current.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="text-slate-600 pl-8">{item.item}</TableCell>
                        <TableCell className="text-right font-mono text-slate-900">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 border-t-2 border-slate-200">
                      <TableCell className="font-bold text-slate-900">Total Current Assets</TableCell>
                      <TableCell className="text-right font-bold font-mono text-slate-900">€17,993.00</TableCell>
                    </TableRow>
                     <TableRow className="bg-slate-800 text-white hover:bg-slate-800">
                      <TableCell className="font-bold">TOTAL ASSETS</TableCell>
                      <TableCell className="text-right font-bold font-mono">€79,740.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="font-serif">Equity & Liabilities</CardTitle>
                <CardDescription>Consolidated Balance Sheet FY 2025 (€ Millions)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line Item</TableHead>
                      <TableHead className="text-right">Value (€ mn)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700" colSpan={2}>Equity</TableCell>
                    </TableRow>
                    {data.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="text-slate-600 pl-8">{item.item}</TableCell>
                        <TableCell className="text-right font-mono text-slate-900">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 border-t-2 border-slate-200">
                      <TableCell className="font-bold text-slate-900">Total Equity</TableCell>
                      <TableCell className="text-right font-bold font-mono text-slate-900">€21,904.00</TableCell>
                    </TableRow>

                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700" colSpan={2}>Non-Current Liabilities</TableCell>
                    </TableRow>
                    {data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="text-slate-600 pl-8">{item.item}</TableCell>
                        <TableCell className="text-right font-mono text-slate-900">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 border-t-2 border-slate-200">
                      <TableCell className="font-bold text-slate-900">Total Non-Current Liab.</TableCell>
                      <TableCell className="text-right font-bold font-mono text-slate-900">€43,853.00</TableCell>
                    </TableRow>

                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700" colSpan={2}>Current Liabilities</TableCell>
                    </TableRow>
                    {data.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="text-slate-600 pl-8">{item.item}</TableCell>
                        <TableCell className="text-right font-mono text-slate-900">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 border-t-2 border-slate-200">
                      <TableCell className="font-bold text-slate-900">Total Current Liab.</TableCell>
                      <TableCell className="text-right font-bold font-mono text-slate-900">€13,983.00</TableCell>
                    </TableRow>

                     <TableRow className="bg-slate-800 text-white hover:bg-slate-800">
                      <TableCell className="font-bold">TOTAL EQUITY & LIAB.</TableCell>
                      <TableCell className="text-right font-bold font-mono">€79,740.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business-units" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.businessUnits.map((bu) => (
              <Card key={bu.id} className="hover:border-slate-400 transition-colors">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-serif text-slate-900">{bu.name}</CardTitle>
                      <CardDescription className="text-xs uppercase tracking-wider mt-1">Business Unit Profile</CardDescription>
                    </div>
                    <Layers className="h-5 w-5 text-slate-300" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 uppercase">Revenue</span>
                      <div className="text-2xl font-mono font-medium text-slate-900">€{bu.financials.revenue}bn</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 uppercase">EBITDA Margin</span>
                      <div className={`text-2xl font-mono font-medium ${bu.financials.margin > 10 ? 'text-green-700' : 'text-slate-900'}`}>
                        {bu.financials.margin}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Key Performance Indicators</span>
                    <ul className="space-y-1">
                      {bu.kpis.map((kpi, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                          <ArrowUpRight className="h-3 w-3 text-slate-400" />
                          {kpi}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-900">
                    <span className="text-xs font-bold uppercase block mb-1 text-yellow-700">Strategic Tension</span>
                    <p className="text-sm italic">"{bu.tension}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="corporate" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Structure & Governance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="text-lg font-medium text-slate-900 mb-2">Organization</h3>
                   <ul className="list-disc pl-5 space-y-2 text-slate-600">
                     <li><strong>Legal Form:</strong> European Stock Corporation (SE)</li>
                     <li><strong>Management Structure:</strong> Dual Board (Management Board + Supervisory Board)</li>
                     <li><strong>Headquarters:</strong> Europe</li>
                     <li><strong>Listing:</strong> Publicly Listed</li>
                   </ul>
                </div>
                <div>
                   <h3 className="text-lg font-medium text-slate-900 mb-2">Key Figures</h3>
                   <ul className="list-disc pl-5 space-y-2 text-slate-600">
                     <li><strong>Total Employees:</strong> 284,000 FTE</li>
                     <li><strong>Market Cap:</strong> €28.7 bn (Significant recent decline)</li>
                     <li><strong>Group Revenue:</strong> €42.0 bn</li>
                     <li><strong>Group EBIT:</strong> €1.4 bn</li>
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
