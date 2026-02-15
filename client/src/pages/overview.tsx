import { motion } from "framer-motion";
import { varexiaData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDownRight, ArrowRight, TrendingDown, Users, Building2, Wallet, AlertCircle } from "lucide-react";
import corporateBg from "@/assets/corporate-bg.png";

export default function Overview() {
  const data = varexiaData;

  return (
    <div className="space-y-8">
      <section className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-border group">
        <div className="absolute inset-0">
          <img 
            src={corporateBg} 
            alt="Corporate HQ" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/40" />
        </div>
        
        <div className="absolute inset-0 p-8 flex flex-col justify-center text-primary-foreground">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground border border-accent/30 text-xs font-medium mb-4 backdrop-blur-md">
              <AlertCircle className="h-3 w-3" />
              Strategic Review Required
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-case-title">{data.name}</h1>
            <p className="text-primary-foreground/70 max-w-xl text-lg leading-relaxed">
              {data.description}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
          >
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow" data-testid={`card-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                  {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {metric.trend === 'down-significant' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
                  {metric.trend === 'stable' && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="text-3xl font-serif font-bold text-foreground">{metric.value}</div>
                {metric.trend.includes('down') && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Attention Required</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground">Business Unit Overview</h2>
          <span className="text-sm text-muted-foreground">FY 2025 Snapshot</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.businessUnits.map((bu, i) => (
            <motion.div
              key={bu.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
            >
              <Card className="h-full hover:border-accent/40 transition-colors cursor-default group" data-testid={`card-bu-overview-${bu.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-foreground flex justify-between items-start">
                    {bu.name}
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                       <Building2 className="h-4 w-4" />
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs font-mono pt-1 text-muted-foreground">
                    Revenue: EUR {bu.revenue}bn | Margin: {bu.margin}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Strategic Tension</span>
                    <p className="text-sm text-foreground/80 font-medium italic">"{bu.tension}"</p>
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
