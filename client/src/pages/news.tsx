import { useState } from "react";
import { varexiaData } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, ChevronRight, ExternalLink, TrendingDown, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const sourceStyles: Record<string, { bg: string; text: string; border: string }> = {
  FT: { bg: "bg-[#FFF1E5]", text: "text-[#33302E]", border: "border-[#E8D5C0]" },
  HB: { bg: "bg-[#F0F4F8]", text: "text-[#1A3A5C]", border: "border-[#C8D8E8]" },
  R: { bg: "bg-[#F5F5F5]", text: "text-[#FF8000]", border: "border-[#E0E0E0]" },
};

export default function News() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>("n1");
  const articles = varexiaData.news || [];
  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2" data-testid="text-news-title">Press & Media Coverage</h1>
        <p className="text-muted-foreground">External reporting and analyst commentary on Varexia SE</p>
      </div>

      <div className="flex h-[calc(100vh-14rem)] gap-4">
        {/* Article List */}
        <Card className="w-[380px] shrink-0 flex flex-col overflow-hidden border-border">
          <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">News Feed</h2>
            <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground">{articles.length} articles</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {articles.map((article) => {
                const style = sourceStyles[article.sourceTag] || sourceStyles.R;
                return (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticleId(article.id)}
                    data-testid={`button-article-${article.id}`}
                    className={`flex flex-col items-start gap-2 p-4 text-left border-b border-border transition-colors hover:bg-muted/50/80 ${
                      selectedArticleId === article.id ? "bg-muted border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-bold ${style.bg} ${style.text} ${style.border}`}>
                        {article.source}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        <span>{article.date.replace("February ", "Feb ").replace(", 2026", "")}</span>
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1">
                        {article.headline}
                      </div>
                      {article.subheadline && (
                        <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {article.subheadline}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border text-muted-foreground">
                      {article.category}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Article Content */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card shadow-sm">
          {selectedArticle ? (() => {
            const style = sourceStyles[selectedArticle.sourceTag] || sourceStyles.R;
            return (
              <>
                <div className={`p-6 border-b ${style.border} ${style.bg}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`${style.bg} ${style.text} border ${style.border} text-xs font-bold`}>
                      {selectedArticle.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {selectedArticle.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground/60 ml-auto">{selectedArticle.date}</span>
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground leading-tight mb-2" data-testid="text-article-headline">
                    {selectedArticle.headline}
                  </h1>
                  {selectedArticle.subheadline && (
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {selectedArticle.subheadline}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-muted-foreground">
                    By <span className="font-medium text-foreground/80">{selectedArticle.author}</span>
                  </div>
                </div>

                <ScrollArea className="flex-1 bg-card">
                  <article className="p-8 max-w-3xl">
                    <div className="text-foreground text-[15px] leading-[1.8] whitespace-pre-wrap font-serif">
                      {selectedArticle.content}
                    </div>

                    <Separator className="my-8" />

                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-4 flex gap-3 items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-semibold">Case Material Notice:</span> This article is provided as background material for the Varexia SE strategic assessment exercise. Consider how external market perception and media narrative may influence stakeholder dynamics and strategic options.
                      </div>
                    </div>
                  </article>
                </ScrollArea>
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
              <Newspaper className="h-12 w-12 mb-4 opacity-20" />
              <p>Select an article to read</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
