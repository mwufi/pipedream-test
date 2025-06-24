"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThreadGroup } from "@/components/ThreadGroup";
import { SearchBar } from "@/components/debug/SearchBar";
import {
  Mail, Users, Calendar, Database, Search, ChevronLeft, ChevronRight,
  BarChart3, Tag, Inbox, Send, FileText, Trash2, Star,
  Archive, MoreHorizontal
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Label colors mapping
const labelColors: Record<string, string> = {
  "Needs Reply": "bg-red-500",
  "To Do": "bg-yellow-500",
  "FYI": "bg-blue-500",
  "Promotion": "bg-purple-500",
  "Waiting": "bg-orange-500",
  "apartments/ML house": "bg-green-500",
  "Support & feedback": "bg-indigo-500",
  "Get Free Months": "bg-pink-500",
};

// Sidebar Item Component
function SidebarItem({
  icon: Icon,
  label,
  count,
  isActive,
  onClick
}: {
  icon: any;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">{count}</span>
      )}
    </button>
  );
}

// Stats Card Component
function StatCard({ title, value, subValue, icon: Icon }: any) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
          </div>
          {Icon && <Icon className="h-8 w-8 text-gray-600" />}
        </div>
      </CardContent>
    </Card>
  );
}

// Email Labels Sidebar
function EmailSidebar({ selectedCategory, onCategoryChange, selectedLabel, onLabelChange, labels }: any) {
  const { data: stats } = useQuery({
    queryKey: ["debug-stats"],
    queryFn: async () => {
      const res = await fetch("/api/debug/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const categories = [
    { id: "all", label: "All", icon: Inbox, count: stats?.overview.emails.total },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "sent", label: "Sent", icon: Send },
    { id: "draft", label: "Drafts", icon: FileText },
    { id: "spam", label: "Spam", icon: Mail },
    { id: "trash", label: "Trash", icon: Trash2 },
    { id: "starred", label: "Starred", icon: Star, count: stats?.overview.emails.starred },
  ];

  return (
    <div className="w-64 border-r border-white/10 h-full">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Categories</h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <SidebarItem
              key={cat.id}
              icon={cat.icon}
              label={cat.label}
              count={cat.count}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryChange(cat.id)}
            />
          ))}
        </div>
      </div>

      {labels && labels.length > 0 && (
        <>
          <Separator className="bg-white/10" />
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Labels</h3>
            <div className="space-y-1">
              {labels.map((label: string) => (
                <button
                  key={label}
                  onClick={() => onLabelChange(selectedLabel === label ? null : label)}
                  className={cn(
                    "flex items-center gap-2 w-full px-4 py-2 text-sm rounded-lg transition-colors",
                    selectedLabel === label
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  )}
                >
                  <Tag className={cn("h-3 w-3", labelColors[label] || "text-gray-400")} />
                  <span className="flex-1 text-left text-gray-300">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Emails View with ThreadGroup
function EmailsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["debug-emails", page, search, category, selectedLabel],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        stats: page === 1 ? "true" : "false",
      });
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);
      if (selectedLabel) params.set("label", selectedLabel);

      const res = await fetch(`/api/debug/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
  });

  // Group emails by month
  const groupedEmails = data?.emails.reduce((groups: any, email: any) => {
    const month = format(parseISO(email.receivedAt), "MMMM yyyy");
    if (!groups[month]) groups[month] = [];

    groups[month].push({
      id: email.id,
      href: `/debug/email/${email.id}`,
      sender: email.from?.name || email.from?.email || "Unknown",
      subject: email.subject || "(No Subject)",
      preview: email.snippet || "",
      messageCount: 1,
      date: format(parseISO(email.receivedAt), "MMM d"),
      labels: email.labels?.map((label: string) => ({
        id: label,
        name: label,
        color: labelColors[label] || "bg-gray-500"
      })) || []
    });

    return groups;
  }, {});

  if (error) return <div className="text-red-500 p-4">Error loading emails</div>;

  return (
    <div className="flex flex-1 h-full">
      <EmailSidebar
        selectedCategory={category}
        onCategoryChange={setCategory}
        selectedLabel={selectedLabel}
        onLabelChange={setSelectedLabel}
        labels={data?.labels}
      />

      <div className="flex-1 flex flex-col">
        <SearchBar 
          placeholder="Search or ask Jace a question"
          value={search}
          onChange={setSearch}
        />

        {/* Stats Summary */}
        {data?.stats && page === 1 && (
          <div className="p-4 grid grid-cols-4 gap-4 border-b border-white/10">
            <StatCard
              title="Total Emails"
              value={data.stats.totalEmails.toLocaleString()}
              subValue={`${data.stats.averagePerDay.toFixed(1)} per day`}
              icon={Mail}
            />
            <StatCard
              title="Date Range"
              value={data.stats.dateRange.earliest ? format(new Date(data.stats.dateRange.earliest), "MMM yyyy") : "N/A"}
              subValue={data.stats.dateRange.latest ? `to ${format(new Date(data.stats.dateRange.latest), "MMM yyyy")}` : ""}
            />
            <StatCard
              title="Top Sender"
              value={data.stats.topSenders[0]?.name || data.stats.topSenders[0]?.sender || "N/A"}
              subValue={`${data.stats.topSenders[0]?.count || 0} emails`}
            />
            <StatCard
              title="Categories"
              value={data.stats.categoryDistribution.length}
              subValue="active folders"
              icon={Archive}
            />
          </div>
        )}

        {/* Email List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading emails...</div>
            ) : !groupedEmails || Object.keys(groupedEmails).length === 0 ? (
              <div className="text-center py-8 text-gray-400">No emails found</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEmails).map(([month, emails]: [string, any]) => (
                  <ThreadGroup
                    key={month}
                    title={month}
                    threads={emails}
                    onThreadClick={(id) => console.log("Email clicked:", id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {data?.pagination && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, data.pagination.totalCount)} of {data.pagination.totalCount}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!data.pagination.hasMore}
                className="text-gray-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Contacts Table
function ContactsView() {
  const [search, setSearch] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["debug-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/debug/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading contacts...</div>;

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((contact: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower) ||
      contact.jobTitle?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <SearchBar 
        placeholder="Search contacts by name, email, company..."
        value={search}
        onChange={setSearch}
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="bg-white/5 rounded-lg border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Company</TableHead>
                <TableHead className="text-gray-400">Relationship</TableHead>
                <TableHead className="text-gray-400">Interactions</TableHead>
                <TableHead className="text-gray-400">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts?.map((contact: any) => (
                <TableRow key={contact.id} className="border-white/10">
                  <TableCell className="font-medium">
                    {contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email}
                  </TableCell>
                  <TableCell className="text-gray-400">{contact.email}</TableCell>
                  <TableCell>
                    <div>{contact.company}</div>
                    {contact.jobTitle && (
                      <div className="text-xs text-gray-500">{contact.jobTitle}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${contact.relationshipStrength || 0}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{contact.interactionCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-white/20">
                      {contact.source || "unknown"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Calendar Events View
function EventsView() {
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["debug-events"],
    queryFn: async () => {
      const res = await fetch("/api/debug/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading events...</div>;

  // Filter events based on search
  const filteredEvents = events?.filter((event: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower) ||
      event.organizer?.name?.toLowerCase().includes(searchLower) ||
      event.organizer?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <SearchBar 
        placeholder="Search events by title, location, organizer..."
        value={search}
        onChange={setSearch}
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="bg-white/5 rounded-lg border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">Title</TableHead>
                <TableHead className="text-gray-400">Date & Time</TableHead>
                <TableHead className="text-gray-400">Location</TableHead>
                <TableHead className="text-gray-400">Organizer</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents?.map((event: any) => (
                <TableRow key={event.id} className="border-white/10">
                  <TableCell className="font-medium">
                    <div>{event.title}</div>
                    {event.description && (
                      <div className="text-xs text-gray-500 truncate max-w-[300px]">
                        {event.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{format(new Date(event.startTime), "MMM d, yyyy")}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location || "-"}
                    {event.meetingUrl && <Badge variant="secondary" className="ml-2 text-xs">Virtual</Badge>}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {event.organizer?.name || event.organizer?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={event.status === "cancelled" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {event.status || "confirmed"}
                    </Badge>
                    {event.isRecurring && <Badge variant="outline" className="ml-1 text-xs">↻</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function DebugPage() {
  return (
    <div className="flex flex-col bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-6 py-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Database className="h-6 w-6" />
          System Data Explorer
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Complete view of all data available to the AI system
        </p>
      </div>

      <Tabs defaultValue="emails" className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-white/10 rounded-none h-auto p-0 px-6">
          <TabsTrigger
            value="emails"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none px-4 py-3"
          >
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none px-4 py-3"
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none px-4 py-3"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="flex-1 m-0">
          <EmailsView />
        </TabsContent>

        <TabsContent value="contacts" className="flex-1 m-0">
          <ContactsView />
        </TabsContent>

        <TabsContent value="events" className="flex-1 m-0">
          <EventsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}