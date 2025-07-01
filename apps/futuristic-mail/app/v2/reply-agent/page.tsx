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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RuleBuilder } from "@/components/RuleBuilder";
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
    ChevronRight,
    Plus,
    X,
    Settings,
    BarChart3,
    TrendingUp,
    Users,
    Target
} from "lucide-react";

// Dummy emails for testing
const dummyEmails = [
    {
        id: 1,
        from: "john.doe@bigcorp.com",
        subject: "URGENT: System Down - Need Immediate Help",
        preview: "Hi, our entire system is down and customers can't access their accounts. This is critical!",
        timestamp: "2 minutes ago",
        priority: "urgent",
        category: "support",
        sentiment: "stressed"
    },
    {
        id: 2,
        from: "sarah.johnson@client.com",
        subject: "Meeting Request for Q4 Planning",
        preview: "Hi, I'd like to schedule a meeting to discuss our Q4 planning strategy. Are you available next week?",
        timestamp: "1 hour ago",
        priority: "high",
        category: "meeting_request",
        sentiment: "neutral"
    },
    {
        id: 3,
        from: "billing@vendor.com",
        subject: "Invoice #INV-2024-001 - Payment Due",
        preview: "This is a reminder that invoice INV-2024-001 for $1,250 is due in 3 days.",
        timestamp: "4 hours ago",
        priority: "medium",
        category: "billing",
        sentiment: "neutral"
    },
    {
        id: 4,
        from: "newsletter@techcrunch.com",
        subject: "Weekly AI Newsletter - Latest Updates",
        preview: "This week's AI highlights: New models, industry news, and breakthrough research...",
        timestamp: "1 day ago",
        priority: "low",
        category: "newsletter",
        sentiment: "neutral"
    }
];

// Available tools/integrations
const availableTools = [
    { id: "calendar", name: "Calendar", description: "Schedule meetings and check availability", icon: Calendar, connected: true },
    { id: "crm", name: "CRM Database", description: "Access customer data and history", icon: Database, connected: true },
    { id: "email", name: "Email Actions", description: "Send, forward, and manage emails", icon: Mail, connected: true },
    { id: "documents", name: "Documents", description: "Search and access company documents", icon: FileText, connected: false },
    { id: "web", name: "Web Search", description: "Research information online", icon: Globe, connected: false },
    { id: "slack", name: "Slack", description: "Send notifications and messages", icon: MessageSquare, connected: false },
];

interface Rule {
    id: string;
    category: string;
    name: string;
    condition: string;
    action: string;
    isActive: boolean;
    complexity: string;
    usage?: string;
    conflicts?: string[];
    lastUsed?: string;
    successRate?: number;
}

export default function ReplyAgentPage() {
    const [rules, setRules] = useState<Rule[]>([
        {
            id: "1",
            category: "priority",
            name: "Urgent Email Response",
            condition: "Email contains 'urgent', 'ASAP', 'critical', or 'emergency'",
            action: "Mark as high priority and respond within 1 hour",
            isActive: true,
            complexity: "Simple",
            usage: "Used 23 times this week",
            successRate: 94
        },
        {
            id: "2",
            category: "response_time",
            name: "Client Response Time",
            condition: "Email is from a client domain (@client.com, @bigcorp.com)",
            action: "Respond within 4 business hours with acknowledgment",
            isActive: true,
            complexity: "Simple",
            usage: "Used 156 times this week",
            successRate: 98
        },
        {
            id: "3",
            category: "tone",
            name: "Professional Communication",
            condition: "All outgoing emails",
            action: "Use professional but friendly tone with proper salutations",
            isActive: true,
            complexity: "Simple",
            usage: "Applied to all emails",
            successRate: 92
        }
    ]);

    const [selectedTools, setSelectedTools] = useState<string[]>(["email", "calendar", "crm"]);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState("rules");
    const [showTestPanel, setShowTestPanel] = useState(false);

    // Generate system prompt from rules
    const generateSystemPrompt = () => {
        const activeRules = rules.filter(rule => rule.isActive);

        // Group rules by category
        const rulesByCategory: Record<string, Rule[]> = {};
        activeRules.forEach(rule => {
            if (!rulesByCategory[rule.category]) {
                rulesByCategory[rule.category] = [];
            }
            rulesByCategory[rule.category].push(rule);
        });

        // Generate detailed rules text
        let rulesText = "";
        Object.entries(rulesByCategory).forEach(([category, categoryRules]) => {
            const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            rulesText += `\n## ${categoryName} Rules\n`;

            categoryRules.forEach((rule, index) => {
                rulesText += `\n${index + 1}. **${rule.name}**\n`;
                rulesText += `   - When: ${rule.condition}\n`;
                rulesText += `   - Then: ${rule.action}\n`;
                if (rule.usage) {
                    rulesText += `   - Usage: ${rule.usage}\n`;
                }
                if (rule.successRate) {
                    rulesText += `   - Success Rate: ${rule.successRate}%\n`;
                }
                rulesText += "\n";
            });
        });

        return `You are an intelligent email assistant. Your role is to help categorize, prioritize, and suggest responses to incoming emails.

## Your Configuration

**Available Integrations:** ${selectedTools.join(', ')}

**Active Rules:** ${activeRules.length} rules across ${Object.keys(rulesByCategory).length} categories
${rulesText}

## Core Responsibilities

1. **Rule Application**: Apply the rules above in order of priority and category
2. **Email Categorization**: Automatically categorize emails based on content and sender
3. **Priority Assessment**: Assess urgency and priority levels using the defined criteria
4. **Response Generation**: Generate contextually appropriate responses following tone guidelines
5. **Escalation**: Flag emails requiring immediate human attention based on escalation rules
6. **Integration Usage**: Leverage available integrations (${selectedTools.join(', ')}) as needed

## Behavior Guidelines

- Always maintain professionalism while being helpful and efficient
- Apply rules in the order they appear within each category
- When multiple rules could apply, prioritize by category: Priority & Urgency > Response Timing > Escalation > Categorization > Tone & Style > Automation
- If no specific rule applies, use general professional communication standards
- Learn from user corrections and feedback when Learning Mode is enabled

## Output Format

For each email, provide:
1. **Category**: The email type/category
2. **Priority**: urgent/high/medium/low based on rules
3. **Triggered Rules**: Which rules were applied
4. **Recommended Action**: What action to take
5. **Response Template**: Suggested response if applicable
6. **Confidence**: Your confidence level (0-100%)`;
    };

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
        setShowTestPanel(true);

        // Simulate AI processing with realistic results
        for (let i = 0; i < dummyEmails.length; i++) {
            const email = dummyEmails[i];
            await new Promise(resolve => setTimeout(resolve, 1200));

            const result = {
                emailId: email.id,
                originalEmail: email,
                analysis: {
                    triggeredRules: getTriggeredRules(email),
                    category: email.category,
                    priority: email.priority,
                    sentiment: email.sentiment,
                    confidence: Math.round(Math.random() * 25 + 75),
                    suggestedAction: getSuggestedAction(email),
                    responseTemplate: getResponseTemplate(email),
                    estimatedTime: getEstimatedTime(email.priority)
                }
            };

            setTestResults(prev => [...prev, result]);
        }

        setIsRunning(false);
    };

    const getTriggeredRules = (email: any) => {
        const triggered = [];
        if (email.subject.toLowerCase().includes('urgent') || email.preview.toLowerCase().includes('critical')) {
            triggered.push('Urgent Email Response');
        }
        if (email.from.includes('@bigcorp.com') || email.from.includes('@client.com')) {
            triggered.push('Client Response Time');
        }
        triggered.push('Professional Communication');
        return triggered;
    };

    const getSuggestedAction = (email: any) => {
        const actions: Record<string, string> = {
            support: "Escalate to support team immediately and acknowledge receipt",
            meeting_request: "Check calendar and propose 3 available time slots",
            billing: "Forward to accounting and confirm receipt",
            newsletter: "Archive and mark as read",
            default: "Review content and respond within standard timeframe"
        };
        return actions[email.category] || actions.default;
    };

    const getResponseTemplate = (email: any) => {
        const templates: Record<string, string> = {
            support: "Thank you for contacting us. I understand this is urgent and I'm escalating this to our technical team immediately. You should hear back within the next hour.",
            meeting_request: "Thank you for reaching out. I'd be happy to discuss Q4 planning with you. Let me check my calendar and get back to you with some available time slots today.",
            billing: "Thank you for the payment reminder. I'll review this invoice and ensure payment is processed promptly.",
            newsletter: "Thank you for the update.",
            default: "Thank you for your email. I'll review this and get back to you soon."
        };
        return templates[email.category] || templates.default;
    };

    const getEstimatedTime = (priority: string) => {
        const times: Record<string, string> = {
            urgent: "15-30 minutes",
            high: "1-2 hours",
            medium: "4-8 hours",
            low: "1-2 days"
        };
        return times[priority] || "4-8 hours";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            urgent: "bg-red-500",
            high: "bg-orange-500",
            medium: "bg-yellow-500",
            low: "bg-green-500"
        };
        return colors[priority] || "bg-slate-500";
    };

    const getRuleStats = () => {
        const totalRules = rules.length;
        const activeRules = rules.filter(r => r.isActive).length;
        const avgSuccessRate = rules.reduce((acc, r) => acc + (r.successRate || 0), 0) / totalRules;

        return { totalRules, activeRules, avgSuccessRate };
    };

    const stats = getRuleStats();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
                    {/* Main Configuration Panel */}
                    <div className={`transition-all duration-300 ${showTestPanel ? 'flex-1' : 'w-full'}`}>
                        <ScrollArea className="h-full">
                            <div className="max-w-6xl mx-auto px-8 py-8">
                                {/* Enhanced Header */}
                                <div className="mb-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                                                <Bot className="h-10 w-10 text-white" />
                                            </div>
                                            <div>
                                                <h1 className="text-4xl font-bold text-slate-900 mb-2">Reply Agent</h1>
                                                <p className="text-slate-600 text-lg">Configure your AI email assistant's behavior and decision-making</p>
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="flex gap-4">
                                            <Card className="text-center p-4 min-w-24">
                                                <div className="text-2xl font-bold text-blue-600">{stats.activeRules}</div>
                                                <div className="text-xs text-slate-500">Active Rules</div>
                                            </Card>
                                            <Card className="text-center p-4 min-w-24">
                                                <div className="text-2xl font-bold text-green-600">{Math.round(stats.avgSuccessRate)}%</div>
                                                <div className="text-xs text-slate-500">Success Rate</div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-8">
                                        <TabsTrigger value="rules" className="flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Rules & Logic
                                        </TabsTrigger>
                                        <TabsTrigger value="integrations" className="flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            Integrations
                                        </TabsTrigger>
                                        <TabsTrigger value="advanced" className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            Advanced
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="rules">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-medium text-slate-900">Configure Rules & Logic</h3>
                                                <p className="text-slate-600">Define how your AI assistant handles different types of emails</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setShowTestPanel(true);
                                                    runTest();
                                                }}
                                                disabled={isRunning}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isRunning ? (
                                                    <>
                                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                        Testing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4 mr-2" />
                                                        Test with Sample Emails
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <RuleBuilder rules={rules} onRulesChange={setRules} />
                                    </TabsContent>

                                    <TabsContent value="integrations">
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Available Integrations</h2>
                                                <p className="text-slate-600 mb-8">Connect tools and services that your agent can access to provide better assistance</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {availableTools.map((tool) => {
                                                    const Icon = tool.icon;
                                                    const isSelected = selectedTools.includes(tool.id);

                                                    return (
                                                        <Card
                                                            key={tool.id}
                                                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                                                                ? "ring-2 ring-blue-500 shadow-md bg-blue-50/50"
                                                                : "hover:shadow-md"
                                                                }`}
                                                            onClick={() => handleToolToggle(tool.id)}
                                                        >
                                                            <CardHeader className="pb-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className={`p-3 rounded-lg ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                                                        }`}>
                                                                        <Icon className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {tool.connected && (
                                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                                Connected
                                                                            </Badge>
                                                                        )}
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <CardTitle className="text-lg">{tool.name}</CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="pt-0">
                                                                <p className="text-sm text-slate-600">{tool.description}</p>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="advanced">
                                        <div className="space-y-8">
                                            <div>
                                                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Advanced Configuration</h2>
                                                <p className="text-slate-600 mb-8">Fine-tune your agent's behavior and review the generated system prompt</p>
                                            </div>

                                            {/* System Prompt Preview */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Bot className="h-5 w-5" />
                                                        Generated System Prompt
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-600">
                                                        This is the instruction set sent to your AI agent (auto-generated from your rules)
                                                    </p>
                                                </CardHeader>
                                                <CardContent>
                                                    <Textarea
                                                        value={generateSystemPrompt()}
                                                        readOnly
                                                        rows={15}
                                                        className="font-mono text-sm bg-slate-50 border-slate-200 resize-none"
                                                    />
                                                </CardContent>
                                            </Card>

                                            {/* Additional Settings */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Behavior Settings</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label className="text-sm font-medium">Automatic Email Categorization</Label>
                                                            <p className="text-xs text-slate-500">Let AI automatically categorize incoming emails</p>
                                                        </div>
                                                        <Checkbox defaultChecked className="data-[state=checked]:bg-blue-600" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label className="text-sm font-medium">Priority Scoring</Label>
                                                            <p className="text-xs text-slate-500">Enable intelligent priority assessment</p>
                                                        </div>
                                                        <Checkbox defaultChecked className="data-[state=checked]:bg-blue-600" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label className="text-sm font-medium">Learning Mode</Label>
                                                            <p className="text-xs text-slate-500">Allow agent to learn from your corrections</p>
                                                        </div>
                                                        <Checkbox defaultChecked className="data-[state=checked]:bg-blue-600" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Conditional Test Panel */}
                    {showTestPanel && (
                        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-xl max-h-screen overflow-y-auto animate-in slide-in-from-right duration-300">
                            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 rounded-lg">
                                            <Play className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900">Live Testing</h2>
                                            <p className="text-sm text-slate-600">See your agent in action</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowTestPanel(false)}
                                        className="text-slate-500 hover:text-slate-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Button
                                    onClick={runTest}
                                    disabled={isRunning}
                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg"
                                >
                                    {isRunning ? (
                                        <>
                                            <Clock className="h-5 w-5 mr-2 animate-spin" />
                                            Processing Emails...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-5 w-5 mr-2" />
                                            Test with Sample Emails
                                        </>
                                    )}
                                </Button>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    {dummyEmails.map((email, index) => {
                                        const result = testResults.find(r => r.emailId === email.id);
                                        const isProcessing = isRunning && !result && index <= testResults.length;

                                        return (
                                            <Card
                                                key={email.id}
                                                className={`transition-all duration-500 ${result ? 'shadow-md border-blue-200' : 'border-slate-200'
                                                    }`}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm text-slate-900 truncate">{email.from}</p>
                                                            <p className="text-xs text-slate-500">{email.timestamp}</p>
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(email.priority)}`} />
                                                    </div>

                                                    <h3 className="font-medium text-sm text-slate-900 leading-snug mb-2">{email.subject}</h3>
                                                    <p className="text-xs text-slate-600 leading-relaxed">{email.preview}</p>
                                                </CardHeader>

                                                <CardContent className="pt-0">
                                                    {isProcessing && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                                <Clock className="h-4 w-4 animate-spin" />
                                                                Analyzing...
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="h-3 bg-slate-100 animate-pulse rounded" />
                                                                <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {result && (
                                                        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2">
                                                            {/* Triggered Rules */}
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-500 mb-2">TRIGGERED RULES</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {result.analysis.triggeredRules.map((rule: string, i: number) => (
                                                                        <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                            {rule}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Analysis Results */}
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Priority:</span>
                                                                    <Badge variant="outline" className={`${email.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        email.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                            email.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                                'bg-green-50 text-green-700 border-green-200'
                                                                        } capitalize`}>
                                                                        {email.priority}
                                                                    </Badge>
                                                                </div>

                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Confidence:</span>
                                                                    <span className="font-medium">{result.analysis.confidence}%</span>
                                                                </div>

                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Response Time:</span>
                                                                    <span className="font-medium">{result.analysis.estimatedTime}</span>
                                                                </div>
                                                            </div>

                                                            {/* Suggested Response */}
                                                            <div>
                                                                <p className="text-xs font-medium text-green-600 mb-2 flex items-center">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    SUGGESTED RESPONSE
                                                                </p>
                                                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                                    <p className="text-xs text-green-800 leading-relaxed italic">
                                                                        "{result.analysis.responseTemplate}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    {!isRunning && testResults.length === 0 && (
                                        <div className="text-center py-12">
                                            <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 text-sm">
                                                Click "Test with Sample Emails" to see how your agent performs
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
} 