import { motion } from "framer-motion";
import { varexiaData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export default function Financials() {
  // Use Varexia data by default for now (in full multi-tenant, we'd use params.id)
  const data = varexiaData;

  const revenueData = data.businessUnits.map(bu => ({
    name: bu.name.split(' ')[0], // Short name for axis
    fullName: bu.name,
    revenue: bu.revenue,
    ebitda: bu.ebitda,
    margin: bu.margin
  }));

  const balanceSheetData = data.balanceSheet;
  const assets = balanceSheetData.filter(i => i.type === 'asset');
  const liabilities = balanceSheetData.filter(i => i.type === 'liability');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Financial Analysis</h1>
        <p className="text-muted-foreground">Consolidated Financial Statements & KPI Overview FY 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs EBITDA Mix */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Revenue vs EBITDA by Unit</CardTitle>
              <CardDescription>Comparison of top-line vs bottom-line contribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}B`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue (€ bn)" fill="hsl(222, 47%, 20%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ebitda" name="EBITDA (€ bn)" fill="hsl(35, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profitability Margin Analysis */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Profitability Profile</CardTitle>
              <CardDescription>EBITDA Margin % across business units</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="margin" name="EBITDA Margin %" fill="hsl(150, 40%, 40%)" radius={[0, 4, 4, 0]} barSize={32}>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.margin > 10 ? 'hsl(150, 40%, 40%)' : 'hsl(0, 60%, 45%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Sheet Structure */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet Structure (FY 2025)</CardTitle>
              <CardDescription>Asset composition vs. Capital Structure (€ bn)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Assets Total: €79.74 bn</h4>
                  {assets.map((item) => (
                    <div key={item.name} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${item.name.includes('Non-current') ? 'bg-primary' : 'bg-muted-foreground'}`} />
                         <span className="text-foreground/80">{item.name}</span>
                      </div>
                      <span className="font-mono font-medium text-foreground">€{item.value.toFixed(2)}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-4">
                        <div 
                          className={`h-full ${item.name.includes('Non-current') ? 'bg-primary' : 'bg-muted-foreground'}`} 
                          style={{ width: `${(item.value / 79.74) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Equity & Liabilities Total: €79.74 bn</h4>
                  {liabilities.map((item) => (
                    <div key={item.name} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${item.name === 'Equity' ? 'bg-yellow-500' : 'bg-foreground/60'}`} />
                         <span className="text-foreground/80">{item.name}</span>
                      </div>
                      <span className="font-mono font-medium text-foreground">€{item.value.toFixed(2)}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-4">
                        <div 
                          className={`h-full ${item.name === 'Equity' ? 'bg-yellow-500' : 'bg-foreground/60'}`} 
                          style={{ width: `${(item.value / 79.74) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
