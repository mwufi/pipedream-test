"use client";

import { useState } from "react";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Bot,
    Play,
    Zap,
    Mail,
    Calendar,
    FileText,
    Database,
    Globe,
    MessageSquare,
    CheckCircle,
    Clock,
    Sparkles,
    ChevronDown,
    ChevronRight
} from "lucide-react";

// Dummy emails for testing
const dummyEmails = [
    {
        id: 1,
        from: "john.doe@example.com",
        subject: "Meeting Request for Q4 Planning",
        preview: "Hi, I'd like to schedule a meeting to discuss our Q4 planning strategy. Are you available next week?",
        timestamp: "2 hours ago",
        priority: "high",
        category: "meeting_request"
    },
    {
        id: 2,
        from: "support@vendor.com",
        subject: "Invoice #INV-2024-001 - Payment Reminder",
        preview: "This is a friendly reminder that invoice INV-2024-001 for $1,250 is due in 3 days.",
        timestamp: "4 hours ago",
        priority: "medium",
        category: "billing"
    },
    {
        id: 3,
        from: "newsletter@techcrunch.com",
        subject: "Daily AI News Digest",
        preview: "Today's top AI stories: OpenAI releases new model, Google announces breakthrough...",
        timestamp: "6 hours ago",
        priority: "low",
        category: "newsletter"
    },
    {
        id: 4,
        from: "client@bigcorp.com",
        subject: "Urgent: Production Issue Needs Immediate Attention",
        preview: "We're experiencing critical issues with the system you deployed. Users can't login.",
        timestamp: "1 hour ago",
        priority: "urgent",
        category: "support"
    }
];

// Available tools/integrations
const availableTools = [
    { id: "calendar", name: "Calendar", description: "Access and manage calendar events", icon: Calendar },
    { id: "crm", name: "CRM Database", description: "Access customer relationship data", icon: Database },
    { id: "email", name: "Email Actions", description: "Send, forward, and manage emails", icon: Mail },
    { id: "documents", name: "Documents", description: "Access and search documents", icon: FileText },
    { id: "web", name: "Web Search", description: "Search the web for information", icon: Globe },
    { id: "slack", name: "Slack", description: "Send messages and notifications", icon: MessageSquare },
];

export default function ReplyAgentPage() {
    const [systemPrompt, setSystemPrompt] = useState(`You are an intelligent email assistant. Your role is to help categorize, prioritize, and suggest responses to incoming emails.

Key responsibilities:
1. Categorize emails into appropriate buckets (meeting_request, support, billing, newsletter, etc.)
2. Assess priority level (urgent, high, medium, low)
3. Generate appropriate response suggestions
4. Flag emails that require immediate attention

Guidelines:
- Be professional and concise
- Maintain the user's communication style
- Always consider context and relationships
- Prioritize actionable items`);

    const [agentName, setAgentName] = useState("Reply Agent");
    const [selectedTools, setSelectedTools] = useState<string[]>(["email", "calendar", "crm"]);
    const [responseStyle, setResponseStyle] = useState("professional");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [autoCategories, setAutoCategories] = useState(true);
    const [priorityScoring, setPriorityScoring] = useState(true);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const handleToolToggle = (toolId: string) => {
        setSelectedTools(prev =>
            prev.includes(toolId)
                ? prev.filter(id => id !== toolId)
                : [...prev, toolId]
        );
    };

    const runTest = async () => {
        setIsRunning(true);
        setTestResults([]);

        // Simulate AI processing with delay and staggered animation
        for (let i = 0; i < dummyEmails.length; i++) {
            const email = dummyEmails[i];
            await new Promise(resolve => setTimeout(resolve, 800));

            // Simulate AI analysis results
            const result = {
                emailId: email.id,
                originalEmail: email,
                analysis: {
                    category: email.category,
                    priority: email.priority,
                    sentiment: Math.random() > 0.5 ? "positive" : "neutral",
                    confidence: Math.round(Math.random() * 30 + 70), // 70-100%
                    suggestedAction: getSuggestedAction(email.category),
                    responseTemplate: getResponseTemplate(email.category, email.subject),
                    estimatedResponseTime: Math.round(Math.random() * 10 + 5) + " minutes"
                }
            };

            setTestResults(prev => [...prev, result]);
        }

        setIsRunning(false);
    };

    const getSuggestedAction = (category: string) => {
        const actions: Record<string, string> = {
            meeting_request: "Schedule meeting and send calendar invite",
            billing: "Forward to accounting department",
            newsletter: "Archive and mark as read",
            support: "Escalate to support team immediately",
            default: "Review and respond within 24 hours"
        };
        return actions[category] || actions.default;
    };

    const getResponseTemplate = (category: string, subject: string) => {
        const templates: Record<string, string> = {
            meeting_request: "Thank you for reaching out. I'd be happy to discuss this with you. Let me check my calendar and get back to you with some available time slots.",
            billing: "Thank you for the reminder. I'll review this invoice and ensure payment is processed promptly.",
            newsletter: "Thank you for the update.",
            support: "I understand this is urgent. Let me investigate this issue immediately and get back to you within the hour.",
            default: "Thank you for your email. I'll review this and get back to you soon."
        };
        return templates[category] || templates.default;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            urgent: "bg-red-400/90",
            high: "bg-orange-400/90",
            medium: "bg-yellow-400/90",
            low: "bg-green-400/90"
        };
        return colors[priority] || "bg-slate-400/90";
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex h-full bg-slate-50/30">
                    {/* Main Configuration Panel */}
                    <div className="flex-1">
                        <ScrollArea className="h-full">
                            <div className="max-w-4xl mx-auto px-8 py-8">
                                {/* Header */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-600 rounded-xl">
                                            <Bot className="h-8 w-8 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-slate-900">Reply Agent</h1>
                                    </div>
                                    <p className="text-slate-600 text-lg">Configure how your AI handles your email, then quickly sanity-check the results.</p>
                                </div>

                                {/* Basics Section */}
                                <div className="mb-16">
                                    <h2 className="text-xl font-semibold text-slate-900 mb-8">Basics</h2>

                                    <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-200/80">
                                        <div className="space-y-3">
                                            <Label htmlFor="agent-name" className="text-slate-700 font-medium">Agent Name</Label>
                                            <Input
                                                id="agent-name"
                                                value={agentName}
                                                onChange={(e) => setAgentName(e.target.value)}
                                                className="border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 h-11"
                                                placeholder="Enter agent name"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="response-style" className="text-slate-700 font-medium">Response Style</Label>
                                            <Select value={responseStyle} onValueChange={setResponseStyle}>
                                                <SelectTrigger className="border-slate-200 focus:ring-2 focus:ring-blue-500 h-11">
                                                    <SelectValue placeholder="Select style" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                    <SelectItem value="concise">Concise</SelectItem>
                                                    <SelectItem value="detailed">Detailed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Behavior Section */}
                                <div className="mb-16">
                                    <h2 className="text-xl font-semibold text-slate-900 mb-8">Behavior</h2>

                                    <div className="space-y-2 mb-8">
                                        <Label htmlFor="system-prompt" className="text-slate-700 font-medium">System Instructions</Label>
                                        <p className="text-sm text-slate-500 mb-4">Tell your agent how to think about and respond to emails</p>
                                        <Textarea
                                            id="system-prompt"
                                            value={systemPrompt}
                                            onChange={(e) => setSystemPrompt(e.target.value)}
                                            rows={10}
                                            className="font-mono text-sm border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                                            placeholder="Enter your system prompt here..."
                                        />
                                    </div>

                                    {/* Advanced Settings Toggle */}
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
                                    >
                                        {showAdvanced ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="font-medium">Advanced Settings</span>
                                    </button>

                                    {showAdvanced && (
                                        <div className="space-y-6 pl-6 border-l-2 border-slate-100">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="auto-categories"
                                                    checked={autoCategories}
                                                    onCheckedChange={(checked) => setAutoCategories(checked === true)}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                                <Label htmlFor="auto-categories" className="text-slate-700">Enable automatic email categorization</Label>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="priority-scoring"
                                                    checked={priorityScoring}
                                                    onCheckedChange={(checked) => setPriorityScoring(checked === true)}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                                <Label htmlFor="priority-scoring" className="text-slate-700">Enable priority scoring</Label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Integrations Section */}
                                <div className="mb-16">
                                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Integrations</h2>
                                    <p className="text-slate-600 mb-8">Choose which tools your agent can access</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {availableTools.map((tool) => {
                                            const Icon = tool.icon;
                                            const isSelected = selectedTools.includes(tool.id);

                                            return (
                                                <div
                                                    key={tool.id}
                                                    className={`group p-6 rounded-xl cursor-pointer transition-all duration-200 min-h-[80px] focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelected
                                                        ? "bg-blue-50 ring-2 ring-blue-500/20 shadow-sm"
                                                        : "bg-white hover:bg-slate-50 shadow-sm hover:shadow-md ring-1 ring-slate-200/80"
                                                        }`}
                                                    onClick={() => handleToolToggle(tool.id)}
                                                    tabIndex={0}
                                                    role="button"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleToolToggle(tool.id);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start space-x-4">
                                                        <div className={`p-3 rounded-lg transition-colors ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                                            }`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                    tabIndex={-1}
                                                                />
                                                            </div>
                                                            <p className="text-sm text-slate-600 leading-relaxed">{tool.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Test Section */}
                    <div className="w-96 bg-white border-l border-slate-200/80 flex flex-col">
                        <div className="p-6 border-b border-slate-200/80">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">Test Run</h2>
                            <p className="text-sm text-slate-600 mb-6">
                                See how your agent handles sample emails
                            </p>
                            <Button
                                onClick={runTest}
                                disabled={isRunning}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                            >
                                {isRunning ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Test with Sample Mail
                                    </>
                                )}
                            </Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-4">
                                {dummyEmails.map((email, index) => {
                                    const result = testResults.find(r => r.emailId === email.id);
                                    const isProcessing = isRunning && !result;

                                    return (
                                        <div
                                            key={email.id}
                                            className={`bg-white rounded-xl p-4 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 ${result ? 'animate-in fade-in-0 slide-in-from-bottom-2' : ''
                                                }`}
                                            style={{
                                                animationDelay: result ? `${index * 50}ms` : '0ms',
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-900 truncate">{email.from}</p>
                                                    <p className="text-xs text-slate-500">{email.timestamp}</p>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(email.priority)} flex-shrink-0`} />
                                            </div>

                                            <h3 className="font-medium text-sm text-slate-900 mb-2 line-clamp-2 leading-relaxed">{email.subject}</h3>
                                            <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">{email.preview}</p>

                                            {isProcessing && (
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-100 animate-pulse rounded" />
                                                    <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                                                    <div className="h-3 bg-slate-100 animate-pulse rounded w-1/2" />
                                                </div>
                                            )}

                                            {result && (
                                                <div className="space-y-3 pt-3 border-t border-slate-200/80">
                                                    <div className="flex items-center justify-between">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                        >
                                                            {result.analysis.category.replace('_', ' ')}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            {result.analysis.confidence}% confident
                                                        </span>
                                                    </div>

                                                    <div className="text-xs space-y-2">
                                                        <div>
                                                            <p className="font-medium text-green-600 mb-1 flex items-center">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Action
                                                            </p>
                                                            <p className="text-slate-600 leading-relaxed">{result.analysis.suggestedAction}</p>
                                                        </div>

                                                        <div>
                                                            <p className="font-medium text-blue-600 mb-1">Response</p>
                                                            <p className="text-slate-600 text-xs italic leading-relaxed bg-slate-50 p-2 rounded">
                                                                "{result.analysis.responseTemplate}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
} 