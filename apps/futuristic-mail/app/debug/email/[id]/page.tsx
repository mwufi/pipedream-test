"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft, Mail, Calendar, User, Tag, Star, Archive,
    Reply, ReplyAll, Forward, Trash2, MoreHorizontal,
    Paperclip, Shield, Clock, Sparkles
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

// Email Actions Component
function EmailActions({ email }: { email: any }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10">
                <Reply className="h-4 w-4 mr-2" />
                Reply
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10">
                <ReplyAll className="h-4 w-4 mr-2" />
                Reply All
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10">
                <Forward className="h-4 w-4 mr-2" />
                Forward
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/20" />
            <Button variant="ghost" size="sm" className="hover:bg-white/10">
                <Star className={cn("h-4 w-4", email.isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-white/10">
                <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-white/10 text-red-400">
                <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
    );
}

// Email Header Component
function EmailHeader({ email }: { email: any }) {
    return (
        <div className="space-y-4">
            {/* Subject and Labels */}
            <div>
                <h1 className="text-2xl font-semibold mb-2">{email.subject || "(No Subject)"}</h1>
                {email.labels && email.labels.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {email.labels.map((label: string) => (
                            <Badge
                                key={label}
                                variant="secondary"
                                className={cn(
                                    "text-xs text-white border-0",
                                    labelColors[label] || "bg-gray-500"
                                )}
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {label}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* From/To/Date Info */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">From:</span>
                    <span className="font-medium">
                        {email.from?.name ? `${email.from.name} <${email.from.email}>` : email.from?.email || "Unknown"}
                    </span>
                </div>

                {email.to && email.to.length > 0 && (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">To:</span>
                        <span>
                            {email.to.map((recipient: any, index: number) => (
                                <span key={index}>
                                    {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                                    {index < email.to.length - 1 && ", "}
                                </span>
                            ))}
                        </span>
                    </div>
                )}

                {email.cc && email.cc.length > 0 && (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">CC:</span>
                        <span>
                            {email.cc.map((recipient: any, index: number) => (
                                <span key={index}>
                                    {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                                    {index < email.cc.length - 1 && ", "}
                                </span>
                            ))}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Date:</span>
                    <span>{format(parseISO(email.receivedAt), "PPPp")}</span>
                </div>

                {email.hasAttachments && (
                    <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Has attachments</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Email Metadata Component
function EmailMetadata({ email, onClassify, isClassifying }: { email: any, onClassify: () => void, isClassifying: boolean }) {
    return (
        <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Email Details
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={onClassify}
                        disabled={isClassifying}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isClassifying ? "Classifying..." : "Classify"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-gray-400">Message ID:</span>
                        <p className="font-mono text-xs break-all">{email.messageId || "N/A"}</p>
                    </div>
                    <div>
                        <span className="text-gray-400">Thread ID:</span>
                        <p className="font-mono text-xs">{email.threadId || "N/A"}</p>
                    </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-gray-400">Category:</span>
                        <p className="capitalize">{email.category || "inbox"}</p>
                    </div>
                    <div>
                        <span className="text-gray-400">Priority:</span>
                        <p className="capitalize">{email.priority || "normal"}</p>
                    </div>
                </div>

                {email.aiCategory && (
                    <>
                        <Separator className="bg-white/10" />
                        <div>
                            <span className="text-gray-400">AI Category:</span>
                            <p className="capitalize">{email.aiCategory}</p>
                        </div>
                    </>
                )}

                {email.aiSentiment && (
                    <>
                        <Separator className="bg-white/10" />
                        <div>
                            <span className="text-gray-400">AI Sentiment:</span>
                            <p className="capitalize">{email.aiSentiment}</p>
                        </div>
                    </>
                )}

                {email.aiSummary && (
                    <>
                        <Separator className="bg-white/10" />
                        <div>
                            <span className="text-gray-400">AI Summary:</span>
                            <p className="text-gray-300">{email.aiSummary}</p>
                        </div>
                    </>
                )}

                {email.aiExtractedData?.isPromotion !== undefined && (
                    <>
                        <Separator className="bg-white/10" />
                        <div>
                            <span className="text-gray-400">Is Promotion:</span>
                            <Badge className={email.aiExtractedData.isPromotion ? "bg-purple-600" : "bg-gray-600"}>
                                {email.aiExtractedData.isPromotion ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function EmailPage() {
    const params = useParams();
    const router = useRouter();
    const emailId = params.id as string;
    const [isClassifying, setIsClassifying] = useState(false);

    const { data: email, isLoading, error, refetch } = useQuery({
        queryKey: ["debug-email", emailId],
        queryFn: async () => {
            const res = await fetch(`/api/debug/emails/${emailId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("Email not found");
                }
                throw new Error("Failed to fetch email");
            }
            return res.json();
        },
    });

    const handleClassify = async () => {
        setIsClassifying(true);
        try {
            const res = await fetch(`/api/enrich/${emailId}`, {
                method: 'POST',
            });
            
            if (!res.ok) {
                throw new Error('Failed to classify email');
            }
            
            const result = await res.json();
            console.log('Classification result:', result);
            
            // Refetch the email to get updated classification data
            await refetch();
        } catch (error) {
            console.error('Error classifying email:', error);
            alert('Failed to classify email. Please try again.');
        } finally {
            setIsClassifying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="hover:bg-white/10"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                    <div className="text-center py-8 text-gray-400">Loading email...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="hover:bg-white/10"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                    <div className="text-center py-8">
                        <div className="text-red-500 mb-2">Error loading email</div>
                        <div className="text-gray-400 text-sm">{error.message}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header with Back Button and Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Debug
                    </Button>
                    <EmailActions email={email} />
                </div>

                {/* Email Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Email Content */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-4">
                                <EmailHeader email={email} />
                            </CardHeader>
                            <CardContent>
                                {/* Email Body */}
                                <div className="prose prose-invert max-w-none">
                                    {email.html_body ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: email.html_body }}
                                            className="email-content"
                                        />
                                    ) : email.body ? (
                                        <pre className="whitespace-pre-wrap font-sans text-gray-300">
                                            {email.body}
                                        </pre>
                                    ) : email.snippet ? (
                                        <p className="text-gray-300">{email.snippet}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">No content available</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar with Metadata */}
                    <div className="space-y-4">
                        <EmailMetadata email={email} onClassify={handleClassify} isClassifying={isClassifying} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .email-content {
          color: #d1d5db;
        }
        .email-content a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .email-content a:hover {
          color: #93c5fd;
        }
        .email-content blockquote {
          border-left: 3px solid #374151;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #9ca3af;
        }
        .email-content pre {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .email-content code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
} 