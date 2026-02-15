import React, { useState } from "react";
import { varexiaData } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Star, Paperclip, Reply, Forward, MoreHorizontal, Inbox, Clock, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function Emails() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>("e1");
  const data = varexiaData;
  const emails = data.emails || [];

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const getInitials = (from: string) => {
    const parts = from.split(",")[0].split(" ");
    if (parts.length >= 2) {
      return parts.slice(0, 2).map(n => n[0]).filter(c => c && c !== '(' && c !== ')').join("");
    }
    return parts[0]?.[0] || "?";
  };

  const getSenderName = (from: string) => from.split(",")[0].trim();
  const getSenderRole = (from: string) => {
    const parts = from.split(",");
    return parts.length > 1 ? parts.slice(1).join(",").trim() : "";
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-1/3 flex flex-col overflow-hidden border-border">
        <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground" data-testid="text-inbox-title">Inbox</h2>
            <Badge variant="secondary" className="ml-1">{emails.length}</Badge>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={`flex flex-col items-start gap-2 p-4 text-left border-b border-border transition-colors hover:bg-muted/50 ${
                  selectedEmailId === email.id ? "bg-muted border-l-4 border-l-accent" : "border-l-4 border-l-transparent"
                }`}
                data-testid={`button-email-${email.id}`}
              >
                <div className="flex w-full items-start justify-between">
                  <span className={`font-semibold text-sm ${!email.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {getSenderName(email.from)}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{email.date.split(",")[1]?.trim()}</span>
                </div>
                <div className="w-full">
                   <div className={`text-sm mb-1 line-clamp-1 ${!email.read ? "font-medium text-foreground" : "text-foreground/70"}`}>
                    {email.subject}
                   </div>
                   <div className="text-xs text-muted-foreground line-clamp-2">
                     {email.content.substring(0, 100).replace(/\n/g, " ")}...
                   </div>
                </div>
                {email.important && (
                  <Badge variant="outline" className="mt-1 border-accent/30 text-accent bg-accent/5 text-[10px] h-5 px-1.5">
                    Priority
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card shadow-sm">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-serif font-bold text-foreground" data-testid="text-email-subject">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-muted-foreground">
                    <Reply className="h-3 w-3" /> Reply
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-muted-foreground">
                    <Forward className="h-3 w-3" /> Forward
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border bg-card text-foreground">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(selectedEmail.from)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-sm text-foreground">{selectedEmail.from}</span>
                    <span className="text-xs text-muted-foreground">{selectedEmail.date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">to Candidate</div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 bg-card">
              <div className="p-8 text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap font-sans max-w-3xl">
                {selectedEmail.content}
              </div>
              
              <div className="px-8 pb-8">
                <Separator className="my-6" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  This message is confidential and intended solely for assessment purposes.
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Mail className="h-12 w-12 mb-4 opacity-20" />
            <p>Select an email to read</p>
          </div>
        )}
      </Card>
    </div>
  );
}
