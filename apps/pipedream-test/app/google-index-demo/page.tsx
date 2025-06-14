"use client";

import { useState, useEffect } from "react";
import type { ProcessedGmailMessage, CalendarEvent, Contact } from "@/lib/google-indexer";

interface Account {
  id: string;
  name: string;
  external_id: string;
  app: {
    name_slug: string;
    name: string;
    img_src: string;
  };
}

interface GoogleAccounts {
  gmail: Account[];
  calendar: Account[];
  contacts: Account[];
}

interface SelectedAccounts {
  gmail?: string;
  calendar?: string;
  contacts?: string;
}

export default function GoogleIndexDemo() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccounts>({
    gmail: [],
    calendar: [],
    contacts: []
  });
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccounts>({});
  const [loading, setLoading] = useState(false);
  const [indexedData, setIndexedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "events" | "contacts">("messages");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const userId = "test-user-123";

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/pipedream/accounts?external_user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      const allAccounts = Array.isArray(data) ? data : data.data || [];
      
      setAccounts(allAccounts);
      
      // Organize Google accounts by service
      const organized: GoogleAccounts = {
        gmail: allAccounts.filter((account: Account) => account.app.name_slug === 'gmail'),
        calendar: allAccounts.filter((account: Account) => account.app.name_slug === 'google_calendar'),
        contacts: allAccounts.filter((account: Account) => account.app.name_slug === 'google_contacts')
      };
      
      setGoogleAccounts(organized);
      
      // Auto-select first account for each service
      setSelectedAccounts({
        gmail: organized.gmail[0]?.id,
        calendar: organized.calendar[0]?.id,
        contacts: organized.contacts[0]?.id
      });
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const indexGoogleData = async () => {
    const hasAnyAccount = selectedAccounts.gmail || selectedAccounts.calendar || selectedAccounts.contacts;
    if (!hasAnyAccount) {
      setError("Please select at least one account");
      return;
    }

    setLoading(true);
    setError(null);
    setIndexedData(null);

    try {
      // Get current date for calendar query
      const now = new Date();
      const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const response = await fetch("/api/google-index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accounts: {
            gmail: selectedAccounts.gmail,
            calendar: selectedAccounts.calendar,
            contacts: selectedAccounts.contacts,
          },
          external_user_id: userId,
          type: "all",
          options: {
            maxResults: 20,
            timeMin: timeMin,
            timeMax: timeMax
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      // Sort messages by date (newest first)
      if (data.data.messages) {
        data.data.messages.sort((a: ProcessedGmailMessage, b: ProcessedGmailMessage) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }

      // Sort events by start time (upcoming first)
      if (data.data.events) {
        data.data.events.sort((a: CalendarEvent, b: CalendarEvent) => {
          const aTime = new Date(a.start.dateTime || a.start.date || 0).getTime();
          const bTime = new Date(b.start.dateTime || b.start.date || 0).getTime();
          return aTime - bTime;
        });
      }

      setIndexedData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  const renderAccountSelector = (serviceType: 'gmail' | 'calendar' | 'contacts', label: string) => {
    const serviceAccounts = googleAccounts[serviceType];
    if (serviceAccounts.length === 0) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={selectedAccounts[serviceType] || ''}
          onChange={(e) => setSelectedAccounts(prev => ({ ...prev, [serviceType]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">None</option>
          {serviceAccounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderMessages = () => {
    if (!indexedData) return null;
    
    if (indexedData.errors?.gmail) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{indexedData.errors.gmail}</p>
        </div>
      );
    }
    
    if (!indexedData.messages?.length) {
      return <p className="text-gray-500">No messages found</p>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gmail Messages ({indexedData.messages.length})</h3>
        {indexedData.messages.map((message: ProcessedGmailMessage) => (
          <div key={message.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleMessageExpansion(message.id)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{message.subject || '(No subject)'}</h4>
                  <p className="text-sm text-gray-600 mt-1">From: {message.from}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatRelativeTime(message.date)}</p>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{message.snippet}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                    expandedMessages.has(message.id) ? 'transform rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {expandedMessages.has(message.id) && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">To:</p>
                      <p className="text-sm text-gray-600">{message.to.join(', ') || 'N/A'}</p>
                    </div>
                    {message.cc.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">CC:</p>
                        <p className="text-sm text-gray-600">{message.cc.join(', ')}</p>
                      </div>
                    )}
                    {message.bcc.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">BCC:</p>
                        <p className="text-sm text-gray-600">{message.bcc.join(', ')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Labels:</p>
                      <p className="text-sm text-gray-600">{message.labels.join(', ') || 'None'}</p>
                    </div>
                  </div>

                  {message.attachments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Attachments ({message.attachments.length}):</p>
                      <div className="mt-1 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                            <span className="font-medium">{attachment.filename}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {attachment.mimeType} • {Math.round(attachment.size / 1024)}KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700">Content:</p>
                    <div className="mt-1 max-h-60 overflow-y-auto bg-white p-3 rounded border">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">{message.body}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEvents = () => {
    if (!indexedData) return null;
    
    if (indexedData.errors?.calendar) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{indexedData.errors.calendar}</p>
        </div>
      );
    }
    
    if (!indexedData.events?.length) {
      return <p className="text-gray-500">No events found</p>;
    }

    const now = new Date();
    const upcomingEvents = indexedData.events.filter((event: CalendarEvent) => {
      const eventTime = new Date(event.start.dateTime || event.start.date || 0);
      return eventTime >= now;
    });
    const pastEvents = indexedData.events.filter((event: CalendarEvent) => {
      const eventTime = new Date(event.start.dateTime || event.start.date || 0);
      return eventTime < now;
    });

    return (
      <div className="space-y-6">
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Upcoming Events ({upcomingEvents.length})</h3>
            <div className="space-y-3">
              {upcomingEvents.map((event: CalendarEvent) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-gray-900">{event.summary}</h4>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Start:</span> {event.start.dateTime ? formatDate(event.start.dateTime) : event.start.date}
                    </div>
                    {event.location && (
                      <div>
                        <span className="font-medium">Location:</span> {event.location}
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div>
                        <span className="font-medium">Attendees:</span> {event.attendees.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Past Events ({pastEvents.length})</h3>
            <div className="space-y-3">
              {pastEvents.map((event: CalendarEvent) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{event.summary}</h4>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Was on:</span> {event.start.dateTime ? formatDate(event.start.dateTime) : event.start.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContacts = () => {
    if (!indexedData) return null;
    
    if (indexedData.errors?.contacts) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{indexedData.errors.contacts}</p>
        </div>
      );
    }
    
    if (!indexedData.contacts?.length) {
      return <p className="text-gray-500">No contacts found</p>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contacts ({indexedData.contacts.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indexedData.contacts.map((contact: Contact) => (
            <div key={contact.resourceName} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">
                {contact.names?.[0]?.displayName || 'No Name'}
              </h4>
              
              {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Email:</p>
                  {contact.emailAddresses.map((email, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {email.value} {email.type && `(${email.type})`}
                    </p>
                  ))}
                </div>
              )}

              {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Phone:</p>
                  {contact.phoneNumbers.map((phone, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {phone.value} {phone.type && `(${phone.type})`}
                    </p>
                  ))}
                </div>
              )}

              {contact.organizations && contact.organizations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Organization:</p>
                  {contact.organizations.map((org, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {org.name} {org.title && `- ${org.title}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Google Data Indexer Demo
          </h1>
          <p className="text-gray-600">
            Fetch and display Gmail messages, calendar events, and contacts from your Google accounts
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Accounts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {renderAccountSelector('gmail', 'Gmail Account')}
            {renderAccountSelector('calendar', 'Calendar Account')}
            {renderAccountSelector('contacts', 'Contacts Account')}
          </div>

          <button
            onClick={indexGoogleData}
            disabled={loading || (!selectedAccounts.gmail && !selectedAccounts.calendar && !selectedAccounts.contacts)}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              loading || (!selectedAccounts.gmail && !selectedAccounts.calendar && !selectedAccounts.contacts)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Indexing Google Data..." : "Index Google Data"}
          </button>

          {(googleAccounts.gmail.length === 0 && googleAccounts.calendar.length === 0 && googleAccounts.contacts.length === 0) && (
            <p className="text-sm text-gray-500 mt-2">
              No Google accounts found. 
              <a href="/me" className="text-blue-600 hover:text-blue-700 ml-1">
                Connect your Google accounts
              </a>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {indexedData && (
          <div className="bg-white shadow rounded-lg">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: "messages", label: "Gmail Messages", count: indexedData?.messages?.length || 0 },
                  { key: "events", label: "Calendar Events", count: indexedData?.events?.length || 0 },
                  { key: "contacts", label: "Contacts", count: indexedData?.contacts?.length || 0 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "messages" && renderMessages()}
              {activeTab === "events" && renderEvents()}
              {activeTab === "contacts" && renderContacts()}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          <a href="/me" className="text-blue-600 hover:text-blue-700">
            Manage Connections
          </a>
          <a href="/api-proxy-demo" className="text-blue-600 hover:text-blue-700">
            API Proxy Demo
          </a>
        </div>
      </div>
    </div>
  );
}