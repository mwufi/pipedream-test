"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Folder, FolderOpen, Search, TestTube, Play, Zap, Clock, FileText, MessageSquare, AlertTriangle, Bot } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Rule {
    id: string;
    category: string;
    name: string;
    condition: string;
    action: string;
    isActive: boolean;
    complexity: string;
    usage?: string;
    successRate?: number;
    isEditing?: boolean;
}

interface Category {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    icon: string;
    iconComponent: any;
}

const categories: Category[] = [
    {
        id: "priority",
        name: "Priority & Urgency",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: "🚨",
        iconComponent: Zap
    },
    {
        id: "response_time",
        name: "Response Timing",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "⏰",
        iconComponent: Clock
    },
    {
        id: "tone",
        name: "Tone & Style",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        icon: "✨",
        iconComponent: MessageSquare
    },
    {
        id: "categorization",
        name: "Email Categorization",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: "📝",
        iconComponent: FileText
    },
    {
        id: "escalation",
        name: "Escalation",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        icon: "🔺",
        iconComponent: AlertTriangle
    },
    {
        id: "automation",
        name: "Automation",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        icon: "🤖",
        iconComponent: Bot
    },
];

// Enhanced rule templates with condition/action format
const ruleTemplates = [
    {
        id: "urgent_response",
        category: "priority",
        name: "Urgent Email Response",
        condition: "Email contains 'urgent', 'ASAP', or 'emergency'",
        action: "Mark as high priority and respond within 1 hour",
        complexity: "Simple",
        usage: "Used 23 times this week"
    },
    {
        id: "client_response_time",
        category: "response_time",
        name: "Client Response Time",
        condition: "Email is from a client domain",
        action: "Respond within 4 business hours",
        complexity: "Simple",
        usage: "Used 156 times this week"
    },
    {
        id: "meeting_requests",
        category: "categorization",
        name: "Meeting Requests",
        condition: "Email mentions scheduling, meetings, or availability",
        action: "Categorize as 'meeting_request' and check calendar",
        complexity: "Medium",
        usage: "Used 45 times this week"
    },
    {
        id: "professional_tone",
        category: "tone",
        name: "Professional Tone",
        condition: "All outgoing emails",
        action: "Use professional but friendly tone",
        complexity: "Simple",
        usage: "Applied to all emails"
    },
    {
        id: "escalate_complaints",
        category: "escalation",
        name: "Escalate Complaints",
        condition: "Email expresses frustration or dissatisfaction",
        action: "Flag for immediate human review",
        complexity: "Medium",
        usage: "Used 8 times this week"
    },
    {
        id: "auto_schedule",
        category: "automation",
        name: "Auto-Schedule Meetings",
        condition: "Meeting request from known contact",
        action: "Automatically propose available times",
        complexity: "Advanced",
        usage: "Used 12 times this week"
    }
];

interface RuleBuilderProps {
    rules: Rule[];
    onRulesChange: (rules: Rule[]) => void;
}

export function RuleBuilder({ rules, onRulesChange }: RuleBuilderProps) {
    const [activeCategory, setActiveCategory] = useState("priority");
    const [searchTerm, setSearchTerm] = useState("");
    const [newRuleText, setNewRuleText] = useState("");
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [testDialog, setTestDialog] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testResults, setTestResults] = useState<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Filter rules by active category and search
    const activeRules = rules.filter((rule) => {
        const matchesCategory = rule.category === activeCategory;
        const matchesSearch = searchTerm === "" ||
            rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.action.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const activeCategoryData = categories.find((cat) => cat.id === activeCategory);

    const toggleRule = (id: string) => {
        onRulesChange(rules.map((rule) => (rule.id === id ? { ...rule, isActive: !rule.isActive } : rule)));
    };

    const removeRule = (id: string) => {
        onRulesChange(rules.filter((rule) => rule.id !== id));
    };

    const startEditing = (id: string) => {
        onRulesChange(rules.map((rule) => (rule.id === id ? { ...rule, isEditing: true } : rule)));
    };

    const saveEdit = (id: string, newName: string, newCondition: string, newAction: string) => {
        onRulesChange(rules.map((rule) =>
            rule.id === id
                ? { ...rule, name: newName, condition: newCondition, action: newAction, isEditing: false }
                : rule
        ));
    };

    const cancelEdit = (id: string) => {
        onRulesChange(rules.map((rule) => (rule.id === id ? { ...rule, isEditing: false } : rule)));
    };

    const addNewRule = () => {
        if (newRuleText.trim()) {
            const newRule: Rule = {
                id: Date.now().toString(),
                category: activeCategory,
                name: "Custom Rule",
                condition: newRuleText.trim(),
                action: "Process accordingly",
                isActive: true,
                complexity: "Simple",
                usage: "New rule"
            };
            onRulesChange([...rules, newRule]);
            setNewRuleText("");
            setIsAddingRule(false);
        }
    };

    const addRuleFromTemplate = (template: typeof ruleTemplates[0]) => {
        const newRule: Rule = {
            id: Date.now().toString(),
            category: template.category,
            name: template.name,
            condition: template.condition,
            action: template.action,
            isActive: true,
            complexity: template.complexity,
            usage: template.usage
        };
        onRulesChange([...rules, newRule]);
        setShowTemplates(false);
    };

    const getRuleCount = (categoryId: string) => {
        return rules.filter((rule) => rule.category === categoryId).length;
    };

    const getEnabledCount = (categoryId: string) => {
        return rules.filter((rule) => rule.category === categoryId && rule.isActive).length;
    };

    const testRules = async () => {
        if (!testEmail.trim()) return;

        // Simulate AI testing
        setTestResults({
            matches: Math.random() > 0.3,
            triggeredRules: activeRules.filter(r => r.isActive).slice(0, 2).map(r => r.name),
            confidence: Math.round(Math.random() * 30 + 70),
            explanation: "This email would trigger multiple rules based on content analysis.",
            suggestedAction: "Mark as high priority and respond within 1 hour"
        });
    };

    useEffect(() => {
        if (isAddingRule && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isAddingRule]);

    return (
        <div className="">
            {/* Header with search */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">Email Rules</h2>
                    <p className="text-slate-600">Configure how your AI handles different types of emails</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search rules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Dialog open={testDialog} onOpenChange={setTestDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Rules
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Test Your Rules</DialogTitle>
                                <DialogDescription>
                                    Paste a sample email to see how your rules would apply
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Paste your test email here..."
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    rows={8}
                                />
                                <Button onClick={testRules} className="w-full">
                                    <Play className="h-4 w-4 mr-2" />
                                    Test Rules
                                </Button>
                                {testResults && (
                                    <div className="bg-slate-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold mb-2">Test Results</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Matches:</span> {testResults.matches ? 'Yes' : 'No'}</p>
                                            <p><span className="font-medium">Triggered Rules:</span> {testResults.triggeredRules.join(', ')}</p>
                                            <p><span className="font-medium">Confidence:</span> {testResults.confidence}%</p>
                                            <p><span className="font-medium">Explanation:</span> {testResults.explanation}</p>
                                            <p><span className="font-medium">Action:</span> {testResults.suggestedAction}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Left Sidebar - Categories */}
                <div className="w-72 bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Folder className="w-4 h-4 text-slate-500" />
                        <h3 className="font-medium text-slate-900">Rule Categories</h3>
                    </div>

                    <div className="space-y-1">
                        {categories.map((category) => {
                            const IconComponent = category.iconComponent;
                            const totalCount = getRuleCount(category.id);
                            const enabledCount = getEnabledCount(category.id);

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-all duration-200 ${activeCategory === category.id
                                        ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-sm"
                                        : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                                        <IconComponent className={`w-4 h-4 ${category.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{category.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {enabledCount}/{totalCount} active
                                        </div>
                                    </div>
                                    {activeCategory === category.id && <FolderOpen className="w-4 h-4 text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Templates */}
                    <div className="mt-6">
                        <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Browse Templates
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Rule Templates</DialogTitle>
                                    <DialogDescription>
                                        Choose from pre-built rules to get started quickly
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                    {ruleTemplates.map((template) => {
                                        const categoryInfo = categories.find(cat => cat.id === template.category);
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => addRuleFromTemplate(template)}
                                                className="p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className={`text-xs ${categoryInfo?.color} ${categoryInfo?.bgColor}`}>
                                                        {categoryInfo?.name}
                                                    </Badge>
                                                </div>
                                                <p className="font-medium text-sm text-slate-900 mb-2">{template.name}</p>
                                                <p className="text-xs text-slate-600 mb-1">
                                                    <span className="font-medium text-blue-600">When:</span> {template.condition}
                                                </p>
                                                <p className="text-xs text-slate-600 mb-2">
                                                    <span className="font-medium text-green-600">Then:</span> {template.action}
                                                </p>
                                                <p className="text-xs text-slate-400">{template.usage}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Right Side - Editor */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        {/* Simplified Header */}
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${activeCategoryData?.bgColor}`}>
                                        {activeCategoryData && <activeCategoryData.iconComponent className={`w-4 h-4 ${activeCategoryData?.color}`} />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{activeCategoryData?.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {activeRules.filter(r => r.isActive).length}/{activeRules.length} active rules
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingRule(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Rule
                                </Button>
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="min-h-[500px]">
                            {activeRules.map((rule, index) => (
                                <EditableRuleLine
                                    key={rule.id}
                                    rule={rule}
                                    lineNumber={index + 1}
                                    categoryData={activeCategoryData!}
                                    onToggle={() => toggleRule(rule.id)}
                                    onRemove={() => removeRule(rule.id)}
                                    onStartEdit={() => startEditing(rule.id)}
                                    onSaveEdit={(name, condition, action) => saveEdit(rule.id, name, condition, action)}
                                    onCancelEdit={() => cancelEdit(rule.id)}
                                />
                            ))}

                            {/* Add new rule line */}
                            {isAddingRule && (
                                <div className="flex items-start gap-4 px-4 py-4 bg-blue-50 border-b border-slate-100">
                                    <div className="mt-1">
                                        <Checkbox checked={true} className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            ref={textareaRef}
                                            value={newRuleText}
                                            onChange={(e) => setNewRuleText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && e.metaKey) {
                                                    addNewRule();
                                                } else if (e.key === "Escape") {
                                                    setIsAddingRule(false);
                                                    setNewRuleText("");
                                                }
                                            }}
                                            placeholder="Describe when this rule should trigger and what action to take..."
                                            className="w-full bg-white border border-blue-300 rounded px-3 py-2 outline-none resize-none text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" onClick={addNewRule}>
                                                Save Rule
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsAddingRule(false);
                                                    setNewRuleText("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {activeRules.length === 0 && !isAddingRule && (
                                <div className="flex items-center gap-4 px-4 py-12 text-slate-400">
                                    <div className="w-4 h-4"></div>
                                    <div className="flex-1 text-sm">
                                        <span className="opacity-60">
                                            No rules in this category yet. Click "Add Rule" to get started.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface EditableRuleLineProps {
    rule: Rule;
    lineNumber: number;
    categoryData: Category;
    onToggle: () => void;
    onRemove: () => void;
    onStartEdit: () => void;
    onSaveEdit: (name: string, condition: string, action: string) => void;
    onCancelEdit: () => void;
}

function EditableRuleLine({
    rule,
    lineNumber,
    categoryData,
    onToggle,
    onRemove,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
}: EditableRuleLineProps) {
    const [editName, setEditName] = useState(rule.name);
    const [editCondition, setEditCondition] = useState(rule.condition);
    const [editAction, setEditAction] = useState(rule.action);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (rule.isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [rule.isEditing]);

    const handleSave = () => {
        onSaveEdit(editName, editCondition, editAction);
    };

    const handleCancel = () => {
        setEditName(rule.name);
        setEditCondition(rule.condition);
        setEditAction(rule.action);
        onCancelEdit();
    };

    return (
        <div className="group flex items-start gap-4 px-4 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
            <div className="mt-1">
                <Checkbox checked={rule.isActive} onCheckedChange={onToggle} className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
                {rule.isEditing ? (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">RULE NAME</label>
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-3 py-2 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Rule name..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">WHEN (CONDITION)</label>
                            <textarea
                                ref={textareaRef}
                                value={editCondition}
                                onChange={(e) => setEditCondition(e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-3 py-2 text-slate-900 leading-relaxed resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Describe when this rule should trigger..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">THEN (ACTION)</label>
                            <textarea
                                value={editAction}
                                onChange={(e) => setEditAction(e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-3 py-2 text-slate-900 leading-relaxed resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Describe what action to take..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                                Save Changes
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={`cursor-text hover:bg-slate-50 rounded px-2 py-2 -mx-2 transition-colors ${!rule.isActive ? "opacity-50" : ""}`} onClick={onStartEdit}>
                        <div className="font-medium text-slate-900 mb-1">{rule.name}</div>
                        {rule.usage && (
                            <div className="text-xs text-slate-400 mb-2">{rule.usage}</div>
                        )}
                        <div className="space-y-1 text-sm">
                            <div className="text-slate-700">
                                <span className="font-medium text-blue-600">When:</span> {rule.condition}
                            </div>
                            <div className="text-slate-700">
                                <span className="font-medium text-green-600">Then:</span> {rule.action}
                            </div>
                        </div>
                        {!rule.isActive && (
                            <div className="text-xs text-slate-400 mt-2 italic">Rule is disabled</div>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded mt-1"
                title="Remove rule"
            >
                <X className="w-4 h-4 text-slate-500" />
            </button>
        </div>
    );
} 