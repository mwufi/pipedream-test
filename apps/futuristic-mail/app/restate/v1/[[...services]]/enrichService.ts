import * as restate from "@restatedev/restate-sdk";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface PersonDetails {
    name: string;
    email?: string;
    company?: string;
    school?: string;
    location?: string;
    additionalInfo?: string;
}

interface EnrichmentResult {
    linkedinProfiles: string[];
    professionalInfo: {
        currentRole?: string;
        company?: string;
        experience?: string[];
    };
    recentNews: string[];
    socialProfiles: {
        platform: string;
        url: string;
        confidence: number;
    }[];
    summary: string;
}

// Define the enrich service
const enrichService = restate.service({
    name: "enrich",
    handlers: {
        // Main handler to enrich person information
        enrichPerson: async (ctx: restate.Context, personDetails: PersonDetails): Promise<EnrichmentResult> => {
            try {
                // Build search query from person details
                const searchTerms = [
                    personDetails.name,
                    personDetails.email,
                    personDetails.company,
                    personDetails.school,
                    personDetails.location,
                    personDetails.additionalInfo
                ].filter(Boolean).join(' ');

                // Search for LinkedIn profiles
                const linkedinProfiles = await searchLinkedInProfiles(searchTerms);

                // Search for general professional information
                const professionalInfo = await searchProfessionalInfo(searchTerms);

                // Search for recent news/mentions
                const recentNews = await searchRecentNews(searchTerms);

                // Search for other social profiles
                const socialProfiles = await searchSocialProfiles(searchTerms);

                // Generate summary
                const summary = await generateSummary(searchTerms, {
                    linkedinProfiles,
                    professionalInfo,
                    recentNews,
                    socialProfiles
                });

                return {
                    linkedinProfiles,
                    professionalInfo,
                    recentNews,
                    socialProfiles,
                    summary
                };
            } catch (error) {
                ctx.console.error("Error enriching person data:", error);
                throw new Error(`Failed to enrich person data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        // Handler to specifically find LinkedIn profiles
        findLinkedIn: async (ctx: restate.Context, personDetails: PersonDetails): Promise<string[]> => {
            try {
                const searchTerms = [
                    personDetails.name,
                    personDetails.email,
                    personDetails.company,
                    personDetails.school,
                    personDetails.location,
                    personDetails.additionalInfo
                ].filter(Boolean).join(' ');

                return await searchLinkedInProfiles(searchTerms);
            } catch (error) {
                ctx.console.error("Error finding LinkedIn profiles:", error);
                throw new Error(`Failed to find LinkedIn profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
});

// Helper function to search for LinkedIn profiles
async function searchLinkedInProfiles(searchTerms: string): Promise<string[]> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {
            user_location: {
                type: "approximate",
                approximate: {
                    country: "US"
                }
            }
        },
        messages: [
            {
                role: "system",
                content: "You are an expert at finding LinkedIn profiles. Search for the most relevant LinkedIn profiles based on the person details provided. Return only verified LinkedIn profile URLs that you find through web search. Be precise and only return URLs that actually exist."
            },
            {
                role: "user",
                content: `Find LinkedIn profiles for: ${searchTerms}. Focus on finding the most accurate matches based on name, email domain, company, and school information. Return the LinkedIn URLs you find with high confidence.`
            }
        ],
        max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || '';

    // Extract LinkedIn URLs from the response
    const linkedinUrls = extractLinkedInUrls(response);
    return linkedinUrls;
}

// Helper function to search for professional information
async function searchProfessionalInfo(searchTerms: string): Promise<{
    currentRole?: string;
    company?: string;
    experience?: string[];
}> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {},
        messages: [
            {
                role: "system",
                content: "You are an expert researcher. Find professional information about the person including their current role, company, and professional experience through web search."
            },
            {
                role: "user",
                content: `Find current professional information for: ${searchTerms}. Look for their current job title, company, and recent career history.`
            }
        ],
        max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || '';

    // Parse professional information from response
    return parseProfessionalInfo(response);
}

// Helper function to search for recent news
async function searchRecentNews(searchTerms: string): Promise<string[]> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {},
        messages: [
            {
                role: "system",
                content: "You are a news researcher. Find recent news articles, press mentions, or notable achievements related to this person from the past year."
            },
            {
                role: "user",
                content: `Find recent news and mentions for: ${searchTerms}. Look for articles, press releases, achievements, or notable activities from 2024-2025.`
            }
        ],
        max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || '';
    return parseNewsItems(response);
}

// Helper function to search for social profiles
async function searchSocialProfiles(searchTerms: string): Promise<{
    platform: string;
    url: string;
    confidence: number;
}[]> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {},
        messages: [
            {
                role: "system",
                content: "You are an expert at finding social media profiles. Search for Twitter/X, GitHub, personal websites, and other professional social profiles."
            },
            {
                role: "user",
                content: `Find social media and professional profiles for: ${searchTerms}. Look for Twitter/X, GitHub, personal websites, and other relevant online profiles.`
            }
        ],
        max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || '';
    return parseSocialProfiles(response);
}

// Helper function to generate summary
async function generateSummary(searchTerms: string, data: any): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an expert at creating professional summaries. Create a concise summary of the person based on all the information gathered."
            },
            {
                role: "user",
                content: `Create a professional summary for ${searchTerms} based on this information: ${JSON.stringify(data, null, 2)}`
            }
        ],
        max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No summary available';
}

// Utility functions for parsing responses
function extractLinkedInUrls(text: string): string[] {
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g;
    const matches = text.match(linkedinRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
}

function parseProfessionalInfo(text: string): {
    currentRole?: string;
    company?: string;
    experience?: string[];
} {
    // Simple parsing - in a production app, you might want more sophisticated parsing
    const lines = text.split('\n').filter(line => line.trim());
    const experience: string[] = [];
    let currentRole: string | undefined;
    let company: string | undefined;

    lines.forEach(line => {
        if (line.toLowerCase().includes('current') || line.toLowerCase().includes('role')) {
            currentRole = line.trim();
        }
        if (line.toLowerCase().includes('company') || line.toLowerCase().includes('works at')) {
            company = line.trim();
        }
        if (line.trim().length > 10) {
            experience.push(line.trim());
        }
    });

    return {
        currentRole,
        company,
        experience: experience.slice(0, 5) // Limit to 5 items
    };
}

function parseNewsItems(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim().length > 20);
    return lines.slice(0, 5); // Limit to 5 news items
}

function parseSocialProfiles(text: string): {
    platform: string;
    url: string;
    confidence: number;
}[] {
    const profiles: { platform: string; url: string; confidence: number; }[] = [];

    // Extract Twitter URLs
    const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/g;
    const twitterMatches = text.match(twitterRegex) || [];
    twitterMatches.forEach(url => profiles.push({ platform: 'Twitter', url, confidence: 0.8 }));

    // Extract GitHub URLs
    const githubRegex = /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-]+/g;
    const githubMatches = text.match(githubRegex) || [];
    githubMatches.forEach(url => profiles.push({ platform: 'GitHub', url, confidence: 0.8 }));

    // Extract personal websites (basic detection)
    const websiteRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const websiteMatches = text.match(websiteRegex) || [];
    websiteMatches.forEach(url => {
        if (!url.includes('linkedin.com') && !url.includes('twitter.com') && !url.includes('github.com')) {
            profiles.push({ platform: 'Website', url, confidence: 0.6 });
        }
    });

    return profiles;
}

// Export the service
export default enrichService; 