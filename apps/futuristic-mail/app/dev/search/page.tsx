"use client";

import { useState, useEffect, useCallback } from "react";

interface EmailResult {
    id: string;
    messageId: string;
    threadId: string;
    accountId: string;
    userId: string;
    subject: string;
    from: string;
    date: string;
    snippet?: string;
    labelIds?: string[];
    fromDomain?: string;
    dayOfWeek?: string;
    year?: number;
    month?: number;
    hasSnippet?: boolean;
    _semanticScore?: number;
}

interface SearchResults {
    hits: EmailResult[];
    query: string;
    processingTimeMs: number;
    limit: number;
    offset: number;
    estimatedTotalHits: number;
    facetDistribution?: Record<string, Record<string, number>>;
}

interface SearchFilters {
    fromDomain?: string;
    year?: number;
    dayOfWeek?: string;
    hasSnippet?: boolean;
}

export default function EmailSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [facets, setFacets] = useState<Record<string, Record<string, number>>>({});
    const [showFacets, setShowFacets] = useState(false);
    const [searchMode, setSearchMode] = useState<'traditional' | 'semantic' | 'hybrid'>('hybrid');

    // Debounced search function
    const debouncedSearch = useCallback(() => {
        const timeoutId = setTimeout(() => {
            performSearch(query, filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, filters]);

    const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                q: searchQuery,
                limit: '50',
                facets: ['fromDomain', 'year', 'dayOfWeek', 'hasSnippet'].join(','),
            });

            // Add hybrid search parameters based on mode
            if (searchMode === 'semantic' || searchMode === 'hybrid') {
                params.append('hybridEmbedder', 'emails-openai');
                params.append('hybridSemanticRatio', searchMode === 'semantic' ? '1.0' : '0.5');
            }

            // Build filter string
            const filterParts: string[] = [];
            if (searchFilters.fromDomain) {
                filterParts.push(`fromDomain = "${searchFilters.fromDomain}"`);
            }
            if (searchFilters.year) {
                filterParts.push(`year = ${searchFilters.year}`);
            }
            if (searchFilters.dayOfWeek) {
                filterParts.push(`dayOfWeek = "${searchFilters.dayOfWeek}"`);
            }
            if (searchFilters.hasSnippet !== undefined) {
                filterParts.push(`hasSnippet = ${searchFilters.hasSnippet}`);
            }

            if (filterParts.length > 0) {
                params.append('filter', filterParts.join(' AND '));
            }

            const response = await fetch(`/api/search/emails?${params}`);

            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResults(data);
            if (data.facetDistribution) {
                setFacets(data.facetDistribution);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [searchMode]);

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        const newFilters = { ...filters };
        if (value === '' || value === null) {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        setFilters(newFilters);
        performSearch(query, newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        performSearch(query, {});
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else if (diffDays < 7) {
                return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            } else if (date.getFullYear() === now.getFullYear()) {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase();
            }
        } catch {
            return dateString;
        }
    };

    const extractSenderName = (from: string) => {
        // Extract name from "Name <email>" format or just return email
        const match = from.match(/^([^<]+?)\s*</);
        if (match) {
            return match[1].trim();
        }
        // If no name, extract everything before @
        const emailMatch = from.match(/([^@]+)@/);
        return emailMatch ? emailMatch[1] : from;
    };

    const getHighlightedText = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, index) =>
                    regex.test(part) ? (
                        <mark key={index} className="bg-yellow-200">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    // Real-time search effect
    useEffect(() => {
        if (query.trim() !== '' || Object.keys(filters).length > 0) {
            const cleanup = debouncedSearch();
            return cleanup;
        } else {
            performSearch("", {});
        }
    }, [query, filters, debouncedSearch, performSearch]);

    return (
        <div className="min-h-screen bg-white">
            {/* Superhuman-style top bar */}
            <div className="border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-medium text-gray-900">Email Search</h1>
                        <div className="flex items-center gap-2">
                            {[
                                { value: 'traditional', label: 'Keyword' },
                                { value: 'semantic', label: 'AI' },
                                { value: 'hybrid', label: 'Hybrid' }
                            ].map((mode) => (
                                <button
                                    key={mode.value}
                                    onClick={() => setSearchMode(mode.value as any)}
                                    className={`px-2 py-1 text-xs rounded ${searchMode === mode.value
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search emails..."
                            className="w-80 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={() => setShowFacets(!showFacets)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Filters
                        </button>
                    </div>
                </div>

                {showFacets && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                        {facets.fromDomain && (
                            <select
                                value={filters.fromDomain || ''}
                                onChange={(e) => handleFilterChange('fromDomain', e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="">All domains</option>
                                {Object.entries(facets.fromDomain)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 10)
                                    .map(([domain, count]) => (
                                        <option key={domain} value={domain}>
                                            {domain} ({count})
                                        </option>
                                    ))}
                            </select>
                        )}

                        {facets.year && (
                            <select
                                value={filters.year || ''}
                                onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : null)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="">All years</option>
                                {Object.entries(facets.year)
                                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                                    .map(([year, count]) => (
                                        <option key={year} value={year}>
                                            {year} ({count})
                                        </option>
                                    ))}
                            </select>
                        )}

                        {Object.keys(filters).length > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Superhuman-style email list */}
            <div className="px-6">
                {error && (
                    <div className="py-4 text-sm text-red-600">
                        Error: {error}
                    </div>
                )}

                {results && (
                    <>
                        {/* Status bar like Superhuman */}
                        <div className="flex items-center justify-between py-3 text-xs text-gray-500 border-b border-gray-100">
                            <div>
                                {results.estimatedTotalHits.toLocaleString()} emails
                                {isLoading && <span className="ml-2">Searching...</span>}
                            </div>
                            <div>
                                {searchMode === 'traditional' && 'Keyword search'}
                                {searchMode === 'semantic' && 'AI semantic search'}
                                {searchMode === 'hybrid' && 'Hybrid search'}
                            </div>
                        </div>

                        {/* Email list - Superhuman style */}
                        <div>
                            {results.hits.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    <div className="text-2xl mb-2">📭</div>
                                    <div className="text-sm">No emails found</div>
                                </div>
                            ) : (
                                results.hits.map((email) => (
                                    <div
                                        key={email.id}
                                        className="grid grid-cols-12 gap-4 py-2 hover:bg-gray-50 cursor-pointer group border-b border-gray-50"
                                    >
                                        {/* Sender column - like Superhuman's left column */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="truncate">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {extractSenderName(email.from)}
                                                </div>
                                                {email.fromDomain && (
                                                    <div className="text-xs text-gray-500">
                                                        {email.fromDomain}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject and snippet - like Superhuman's middle column */}
                                        <div className="col-span-7 min-w-0">
                                            <div className="text-sm text-gray-900 truncate flex items-center gap-2">
                                                <span className="font-medium">
                                                    {getHighlightedText(email.subject, query)}
                                                </span>
                                                {email.snippet && (
                                                    <>
                                                        <span className="text-gray-400">—</span>
                                                        <span className="text-gray-600 font-normal">
                                                            {getHighlightedText(email.snippet, query)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date and metadata - like Superhuman's right column */}
                                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                            {email._semanticScore !== undefined && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                    {(email._semanticScore * 100).toFixed(0)}%
                                                </span>
                                            )}
                                            <div className="text-xs text-gray-500 font-medium">
                                                {formatDate(email.date)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 