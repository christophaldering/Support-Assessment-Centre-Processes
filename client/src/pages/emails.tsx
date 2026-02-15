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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Email List - Left Pane */}
      <Card className="w-1/3 flex flex-col overflow-hidden border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Inbox</h2>
            <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-600">{emails.length}</Badge>
          </div>
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
               <Clock className="h-4 w-4" />
             </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={`flex flex-col items-start gap-2 p-4 text-left border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${
                  selectedEmailId === email.id ? "bg-slate-100 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <span className={`font-semibold text-sm ${!email.read ? "text-slate-900" : "text-slate-600"}`}>
                    {email.from.split(",")[0]}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{email.date.split(",")[1].trim()}</span>
                </div>
                <div className="w-full">
                   <div className={`text-sm mb-1 line-clamp-1 ${!email.read ? "font-medium text-slate-900" : "text-slate-700"}`}>
                    {email.subject}
                   </div>
                   <div className="text-xs text-slate-500 line-clamp-2">
                     {email.content.substring(0, 100).replace(/\n/g, " ")}...
                   </div>
                </div>
                {email.important && (
                  <Badge variant="outline" className="mt-1 border-red-200 text-red-700 bg-red-50 text-[10px] h-5 px-1.5">
                    Important
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Email Content - Right Pane */}
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm">
        {selectedEmail ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-serif font-bold text-slate-900">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-slate-600">
                    <Reply className="h-3 w-3" /> Reply
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-slate-600">
                    <Forward className="h-3 w-3" /> Forward
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200 bg-white text-slate-700">
                  <AvatarFallback className="bg-slate-100 text-slate-700">
                    {selectedEmail.from.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-sm text-slate-900">{selectedEmail.from}</span>
                    <span className="text-xs text-slate-400">{selectedEmail.date}</span>
                  </div>
                  <div className="text-xs text-slate-500">to me, Executive Board</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1 bg-white">
              <div className="p-8 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans max-w-3xl">
                {selectedEmail.content}
              </div>
              
              <div className="px-8 pb-8">
                <Separator className="my-6" />
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  This message is confidential and intended solely for the Executive Board.
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Mail className="h-12 w-12 mb-4 opacity-20" />
            <p>Select an email to read</p>
          </div>
        )}
      </Card>
    </div>
  );
}
