"use client";

import { useState, useEffect } from "react";
import db from "@/lib/instant_clientside_db";
import { EnrichmentResultWithMeta, enrichPersonTool } from "@/tools/enrichment";

interface EnrichmentFormData {
    name: string;
    email: string;
    company: string;
    school: string;
    location: string;
    additionalInfo: string;
}

export default function EnrichDevPage() {
    const [formData, setFormData] = useState<EnrichmentFormData>({
        name: "",
        email: "",
        company: "",
        school: "",
        location: "",
        additionalInfo: "",
    });
    const [isEnriching, setIsEnriching] = useState(false);
    const [selectedEnrichment, setSelectedEnrichment] = useState<string | null>(null);

    // Query all enrichments from InstantDB
    const { data, isLoading } = db.useQuery({
        enrichments: {
            $: {
                order: {
                    serverCreatedAt: "desc"
                }
            }
        }
    });

    const enrichments = data?.enrichments || [];
    const selectedEnrichmentData = enrichments.find(e => e.id === selectedEnrichment);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEnrich = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsEnriching(true);
        try {
            const enrichmentInput = {
                name: formData.name,
                ...(formData.email && { email: formData.email }),
                ...(formData.company && { company: formData.company }),
                ...(formData.school && { school: formData.school }),
                ...(formData.location && { location: formData.location }),
                ...(formData.additionalInfo && { additionalInfo: formData.additionalInfo }),
            };

            const result = await enrichPersonTool(enrichmentInput);
            setSelectedEnrichment(result.id);

            // Clear form
            setFormData({
                name: "",
                email: "",
                company: "",
                school: "",
                location: "",
                additionalInfo: "",
            });
        } catch (error) {
            console.error("Enrichment failed:", error);
        } finally {
            setIsEnriching(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'failed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'pending': return '⏳';
            case 'failed': return '❌';
            default: return '❓';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        🔍 Person Enrichment Lab
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Discover comprehensive information about people using AI-powered web search
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Enrichment Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                                <span className="mr-2">🚀</span>
                                New Enrichment
                            </h2>

                            <form onSubmit={handleEnrich} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Sara Lee"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="sara@fina.com"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        placeholder="Fina Technologies"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        School
                                    </label>
                                    <input
                                        type="text"
                                        name="school"
                                        value={formData.school}
                                        onChange={handleInputChange}
                                        placeholder="UC Berkeley"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="San Francisco, CA"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Info
                                    </label>
                                    <textarea
                                        name="additionalInfo"
                                        value={formData.additionalInfo}
                                        onChange={handleInputChange}
                                        placeholder="Any other details you know about this person..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isEnriching || !formData.name.trim()}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isEnriching ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enriching...
                                        </span>
                                    ) : (
                                        "🔍 Enrich Person"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Enrichments List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                                <span className="mr-2">📋</span>
                                Recent Enrichments
                            </h2>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : enrichments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">🤔</div>
                                    <p>No enrichments yet. Try enriching someone!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {enrichments.map((enrichment: any) => (
                                        <div
                                            key={enrichment.id}
                                            onClick={() => setSelectedEnrichment(enrichment.id)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${selectedEnrichment === enrichment.id
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 bg-white/80 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800">
                                                        {enrichment.personDetails?.name || 'Unknown'}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {enrichment.personDetails?.email || enrichment.personDetails?.company || 'No additional info'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(enrichment.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrichment.status)}`}>
                                                    {getStatusIcon(enrichment.status)} {enrichment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enrichment Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                                <span className="mr-2">📊</span>
                                Enrichment Details
                            </h2>

                            {selectedEnrichmentData ? (
                                <div className="space-y-6 max-h-96 overflow-y-auto">
                                    {/* Status & Summary */}
                                    <div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEnrichmentData.status)} mb-4`}>
                                            {getStatusIcon(selectedEnrichmentData.status)} {selectedEnrichmentData.status}
                                        </div>

                                        {selectedEnrichmentData.summary && (
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-800 mb-2">📝 Summary</h4>
                                                <p className="text-blue-700 text-sm">{selectedEnrichmentData.summary}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* LinkedIn Profiles */}
                                    {selectedEnrichmentData.linkedinProfiles?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <span className="mr-2">🔗</span>
                                                LinkedIn Profiles
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedEnrichmentData.linkedinProfiles.map((url: string, index: number) => (
                                                    <a
                                                        key={index}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-3 text-blue-700 hover:text-blue-800 transition-colors"
                                                    >
                                                        {url}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Professional Info */}
                                    {selectedEnrichmentData.professionalInfo && Object.keys(selectedEnrichmentData.professionalInfo).length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <span className="mr-2">💼</span>
                                                Professional Info
                                            </h4>
                                            <div className="bg-green-50 rounded-lg p-4 space-y-2">
                                                {selectedEnrichmentData.professionalInfo.currentRole && (
                                                    <p><span className="font-medium">Role:</span> {selectedEnrichmentData.professionalInfo.currentRole}</p>
                                                )}
                                                {selectedEnrichmentData.professionalInfo.company && (
                                                    <p><span className="font-medium">Company:</span> {selectedEnrichmentData.professionalInfo.company}</p>
                                                )}
                                                {selectedEnrichmentData.professionalInfo.experience?.length > 0 && (
                                                    <div>
                                                        <span className="font-medium">Experience:</span>
                                                        <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                                                            {selectedEnrichmentData.professionalInfo.experience.map((exp: string, index: number) => (
                                                                <li key={index} className="text-sm">{exp}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent News */}
                                    {selectedEnrichmentData.recentNews?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <span className="mr-2">📰</span>
                                                Recent News
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedEnrichmentData.recentNews.map((news: string, index: number) => (
                                                    <div key={index} className="bg-yellow-50 rounded-lg p-3">
                                                        <p className="text-yellow-800 text-sm">{news}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Social Profiles */}
                                    {selectedEnrichmentData.socialProfiles?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <span className="mr-2">🌐</span>
                                                Social Profiles
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedEnrichmentData.socialProfiles.map((profile: any, index: number) => (
                                                    <div key={index} className="bg-purple-50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <a
                                                                href={profile.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-purple-700 hover:text-purple-800 font-medium"
                                                            >
                                                                {profile.platform}
                                                            </a>
                                                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                                                                {Math.round(profile.confidence * 100)}% confident
                                                            </span>
                                                        </div>
                                                        <p className="text-purple-600 text-sm truncate mt-1">{profile.url}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {selectedEnrichmentData.error && (
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-red-800 mb-2">❌ Error</h4>
                                            <p className="text-red-700 text-sm">{selectedEnrichmentData.error}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">👈</div>
                                    <p>Select an enrichment to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 