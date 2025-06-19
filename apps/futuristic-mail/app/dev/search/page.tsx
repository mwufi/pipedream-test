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
    const [showFacets, setShowFacets] = useState(true);
    const [useSemanticSearch, setUseSemanticSearch] = useState(true);
    const [searchMode, setSearchMode] = useState<'traditional' | 'semantic' | 'hybrid'>('hybrid');

    // Debounced search function
    const debouncedSearch = useCallback(() => {
        const timeoutId = setTimeout(() => {
            performSearch(query, filters);
        }, 300); // 300ms debounce delay

        return () => clearTimeout(timeoutId);
    }, [query, filters]);

    const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                q: searchQuery,
                limit: '20',
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

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query, filters);
    }, [query, filters, performSearch]);

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
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getHighlightedText = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, index) =>
                    regex.test(part) ? (
                        <mark key={index} className="bg-yellow-200 px-1 rounded">
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
            // Load initial results when query is empty
            performSearch("", {});
        }
    }, [query, filters, debouncedSearch, performSearch]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        🚀 AI-Powered Email Search
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Search through your email archive with AI semantic search and powerful filtering
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search emails by meaning, keywords, or content... (search as you type!)"
                                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFacets(!showFacets)}
                                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                            >
                                {showFacets ? '🔽' : '▶️'} Filters
                            </button>
                        </div>

                        {/* Search Mode Selection */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">Search Mode:</span>
                            <div className="flex gap-2">
                                {[
                                    { value: 'traditional', label: '📝 Traditional', desc: 'Exact keyword matching' },
                                    { value: 'semantic', label: '🧠 AI Semantic', desc: 'Search by meaning' },
                                    { value: 'hybrid', label: '⚡ Hybrid', desc: 'Best of both worlds' }
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => setSearchMode(mode.value as any)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${searchMode === mode.value
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-white/80 text-gray-700 hover:bg-white'
                                            }`}
                                        title={mode.desc}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                            {isLoading && (
                                <div className="flex items-center text-sm text-gray-500">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Searching...
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    {showFacets && (
                        <div className="lg:col-span-1">
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 sticky top-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
                                    {Object.keys(filters).length > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Domain Filter */}
                                    {facets.fromDomain && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Domain
                                            </label>
                                            <select
                                                value={filters.fromDomain || ''}
                                                onChange={(e) => handleFilterChange('fromDomain', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                                        </div>
                                    )}

                                    {/* Year Filter */}
                                    {facets.year && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Year
                                            </label>
                                            <select
                                                value={filters.year || ''}
                                                onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                                        </div>
                                    )}

                                    {/* Day of Week Filter */}
                                    {facets.dayOfWeek && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Day of Week
                                            </label>
                                            <select
                                                value={filters.dayOfWeek || ''}
                                                onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">All days</option>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                                    .filter(day => facets.dayOfWeek[day])
                                                    .map((day) => (
                                                        <option key={day} value={day}>
                                                            {day} ({facets.dayOfWeek[day]})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Has Snippet Filter */}
                                    {facets.hasSnippet && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Content Preview
                                            </label>
                                            <select
                                                value={filters.hasSnippet === undefined ? '' : filters.hasSnippet.toString()}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handleFilterChange('hasSnippet', value === '' ? undefined : value === 'true');
                                                }}
                                                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">All emails</option>
                                                <option value="true">With preview ({facets.hasSnippet['true'] || 0})</option>
                                                <option value="false">No preview ({facets.hasSnippet['false'] || 0})</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    <div className={showFacets ? "lg:col-span-3" : "lg:col-span-4"}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-red-800">
                                    <span className="font-medium">Error:</span> {error}
                                </p>
                                <p className="text-red-600 text-sm mt-1">
                                    Make sure Meilisearch is running and the AI-powered emails have been indexed.
                                </p>
                            </div>
                        )}

                        {/* Search Mode Info */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                                    {searchMode === 'traditional' ? '📝' : searchMode === 'semantic' ? '🧠' : '⚡'}
                                </span>
                                <h3 className="font-medium text-blue-900">
                                    {searchMode === 'traditional' && 'Traditional Search'}
                                    {searchMode === 'semantic' && 'AI Semantic Search'}
                                    {searchMode === 'hybrid' && 'Hybrid AI Search'}
                                </h3>
                            </div>
                            <p className="text-sm text-blue-700">
                                {searchMode === 'traditional' && 'Searching for exact keyword matches in email content.'}
                                {searchMode === 'semantic' && 'Using AI to understand the meaning of your query and find conceptually similar emails.'}
                                {searchMode === 'hybrid' && 'Combining traditional keyword matching with AI semantic understanding for best results.'}
                            </p>
                        </div>

                        {results && (
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Search Results
                                    </h2>
                                    <div className="text-sm text-gray-600">
                                        {results.estimatedTotalHits.toLocaleString()} emails found in{' '}
                                        {results.processingTimeMs}ms
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {results.hits.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">📭</div>
                                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                                No emails found
                                            </h3>
                                            <p className="text-gray-600">
                                                Try adjusting your search terms, switching search modes, or clearing filters
                                            </p>
                                        </div>
                                    ) : (
                                        results.hits.map((email) => (
                                            <div
                                                key={email.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900 flex-1">
                                                        {getHighlightedText(email.subject, query)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        {email._semanticScore !== undefined && (
                                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                                                AI: {(email._semanticScore * 100).toFixed(0)}%
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                                            {formatDate(email.date)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">
                                                        {getHighlightedText(email.from, query)}
                                                    </span>
                                                    {email.fromDomain && (
                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                            {email.fromDomain}
                                                        </span>
                                                    )}
                                                </div>

                                                {email.snippet && (
                                                    <p className="text-sm text-gray-700 line-clamp-2">
                                                        {getHighlightedText(email.snippet, query)}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        {email.dayOfWeek && (
                                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                                {email.dayOfWeek}
                                                            </span>
                                                        )}
                                                        {email.year && (
                                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                                {email.year}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ID: {email.messageId.slice(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 