"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Users, Calendar, Database, TrendingUp, Search, ChevronLeft, ChevronRight, BarChart3, PieChart } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Stats Component
function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["debug-stats"],
    queryFn: async () => {
      const res = await fetch("/api/debug/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (!stats) return null;

  const { overview, emailInsights, contactInsights } = stats;

  return (
    <div className="grid gap-4 mb-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Emails</span>
              <span className="font-semibold">{overview.emails.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date Range</span>
              <span className="text-xs">
                {overview.emails.earliest && format(new Date(overview.emails.earliest), "MMM yyyy")} - 
                {overview.emails.latest && format(new Date(overview.emails.latest), "MMM yyyy")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.emails.unread}</div>
                <div className="text-xs text-muted-foreground">Unread</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.emails.starred}</div>
                <div className="text-xs text-muted-foreground">Starred</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Contacts</span>
              <span className="font-semibold">{overview.contacts.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Relationship</span>
              <span className="text-sm">
                {overview.contacts.avgRelationshipStrength?.toFixed(0) || 0}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.contacts.withCompany}</div>
                <div className="text-xs text-muted-foreground">Companies</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.contacts.enriched}</div>
                <div className="text-xs text-muted-foreground">Enriched</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Events</span>
              <span className="font-semibold">{overview.events.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date Range</span>
              <span className="text-xs">
                {overview.events.earliest && format(new Date(overview.events.earliest), "MMM yyyy")} - 
                {overview.events.latest && format(new Date(overview.events.latest), "MMM yyyy")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.events.upcoming}</div>
                <div className="text-xs text-muted-foreground">Upcoming</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-semibold">{overview.events.recurring}</div>
                <div className="text-xs text-muted-foreground">Recurring</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {emailInsights.topDomains && emailInsights.topDomains.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Email Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emailInsights.topDomains.slice(0, 5).map((domain: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-32 truncate">
                    {domain.domain || "Unknown"}
                  </span>
                  <Progress value={(domain.count / overview.emails.total) * 100} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {domain.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Email Table Component
function EmailsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["debug-emails", page, search, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        stats: page === 1 ? "true" : "false",
      });
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);

      const res = await fetch(`/api/debug/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
  });

  if (error) return <div className="text-red-500">Error loading emails</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="inbox">Inbox</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data?.stats && (
        <div className="grid gap-2 md:grid-cols-4 mb-4">
          <Card className="p-3">
            <div className="text-2xl font-semibold">{data.stats.totalEmails.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Emails</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-semibold">{data.stats.averagePerDay.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg/Day</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm font-medium">Top Sender</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.stats.topSenders[0]?.sender || "N/A"}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-sm font-medium">Date Range</div>
            <div className="text-xs text-muted-foreground">
              {data.stats.dateRange.earliest && format(new Date(data.stats.dateRange.earliest), "PP")}
            </div>
          </Card>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[200px]">From</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">AI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-pulse">Loading emails...</div>
                </TableCell>
              </TableRow>
            ) : data?.emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No emails found
                </TableCell>
              </TableRow>
            ) : (
              data?.emails.map((email: any) => (
                <TableRow key={email.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {email.category || "inbox"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[400px]">{email.subject || "(No Subject)"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                      {email.snippet}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate">{email.from?.name || email.from?.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{email.from?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(email.receivedAt), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {email.isRead && <Badge variant="secondary" className="text-xs">Read</Badge>}
                      {email.isStarred && <Badge variant="secondary" className="text-xs">★</Badge>}
                      {email.hasAttachments && <Badge variant="secondary" className="text-xs">📎</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {email.aiSentiment && (
                      <Badge 
                        variant={email.aiSentiment === "positive" ? "default" : 
                                email.aiSentiment === "negative" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {email.aiSentiment}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, data.pagination.totalCount)} of {data.pagination.totalCount}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!data.pagination.hasMore}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Contacts Table Component
function ContactsTable() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["debug-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/debug/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-muted rounded-lg" />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="w-[100px]">Strength</TableHead>
            <TableHead className="w-[100px]">Interactions</TableHead>
            <TableHead className="w-[100px]">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts?.map((contact: any) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">
                  {contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{contact.email}</TableCell>
                <TableCell>
                  <div>{contact.company}</div>
                  {contact.jobTitle && (
                    <div className="text-xs text-muted-foreground">{contact.jobTitle}</div>
                  )}
                </TableCell>
                <TableCell>
                  {contact.relationshipStrength && (
                    <Progress value={contact.relationshipStrength} className="w-full" />
                  )}
                </TableCell>
                <TableCell className="text-center">{contact.interactionCount || 0}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {contact.source || "unknown"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Calendar Events Table Component
function EventsTable() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["debug-events"],
    queryFn: async () => {
      const res = await fetch("/api/debug/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-muted rounded-lg" />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="w-[200px]">Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-[150px]">Organizer</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events?.map((event: any) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  <div>{event.title}</div>
                  {event.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {event.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(event.startTime), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {event.location || "-"}
                  {event.meetingUrl && <Badge variant="secondary" className="ml-2 text-xs">Virtual</Badge>}
                </TableCell>
                <TableCell className="text-sm truncate">
                  {event.organizer?.name || event.organizer?.email || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={event.status === "cancelled" ? "destructive" : "default"} className="text-xs">
                    {event.status || "confirmed"}
                  </Badge>
                  {event.isRecurring && <Badge variant="outline" className="ml-1 text-xs">↻</Badge>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DebugPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8" />
          System Data Explorer
        </h1>
        <p className="text-muted-foreground">
          Complete view of all data available to the AI system
        </p>
      </div>

      <StatsOverview />

      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="events">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-6">
          <EmailsTable />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactsTable />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}