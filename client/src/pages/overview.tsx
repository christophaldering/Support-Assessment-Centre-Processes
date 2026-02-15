import { motion } from "framer-motion";
import { companyData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDownRight, ArrowRight, TrendingDown, Users, Building2, Wallet, AlertCircle } from "lucide-react";
import corporateBg from "@/assets/corporate-bg.png";

export default function Overview() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 group">
        <div className="absolute inset-0">
          <img 
            src={corporateBg} 
            alt="Corporate HQ" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/40" />
        </div>
        
        <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-medium mb-4 backdrop-blur-md">
              <AlertCircle className="h-3 w-3" />
              Strategic Review Required
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2">Varexia Group</h1>
            <p className="text-slate-300 max-w-xl text-lg leading-relaxed">
              Independent senior-level assessment of the Group’s current situation, financial profile, and governance structure.
            </p>
          </motion.div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {companyData.metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
          >
            <Card className="border-l-4 border-l-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{metric.label}</span>
                  {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {metric.trend === 'down-significant' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
                  {metric.trend === 'stable' && <ArrowRight className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="text-3xl font-serif font-bold text-slate-900">{metric.value}</div>
                {metric.trend.includes('down') && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Attention Required</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Business Unit Preview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800">Business Unit Overview</h2>
          <span className="text-sm text-slate-500">FY 2025 Snapshot</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companyData.businessUnits.map((bu, i) => (
            <motion.div
              key={bu.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
            >
              <Card className="h-full hover:border-slate-400 transition-colors cursor-default group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-slate-800 flex justify-between items-start">
                    {bu.name}
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                       <Building2 className="h-4 w-4" />
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs font-mono pt-1 text-slate-500">
                    Revenue: €{bu.revenue}bn • Margin: {bu.margin}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Strategic Tension</span>
                    <p className="text-sm text-slate-700 font-medium italic">"{bu.tension}"</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
