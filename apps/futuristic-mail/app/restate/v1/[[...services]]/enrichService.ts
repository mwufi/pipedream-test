import * as restate from "@restatedev/restate-sdk";
import OpenAI from "openai";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/react";

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

interface EnrichmentRequest {
    enrichmentId: string;
    personDetails: PersonDetails;
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
        enrichPerson: async (ctx: restate.Context, request: EnrichmentRequest): Promise<EnrichmentResult> => {
            const { enrichmentId, personDetails } = request;
            try {
                // Build initial search query from person details
                const initialSearchTerms = [
                    personDetails.name,
                    personDetails.email,
                    personDetails.company,
                    personDetails.school,
                    personDetails.location,
                    personDetails.additionalInfo
                ].filter(Boolean).join(' ');

                // Update status to in progress
                await ctx.run("update-status-in-progress", async () => {
                    try {
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                status: 'in_progress',
                                phase: 'discovery'
                            })
                        ]);
                    } catch (error) {
                        console.error('wow, hot:', JSON.stringify(error, null, 2));
                        throw error; // Re-throw to maintain error handling flow
                    }
                });

                // PHASE 1: Fast parallel discovery of core information
                const [linkedinProfiles, basicProfessionalInfo] = await Promise.all([
                    // Search for LinkedIn profiles durably
                    ctx.run("search-linkedin", async () => {
                        const profiles = await searchLinkedInProfiles(initialSearchTerms);
                        // Update progress
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                linkedinProfiles: profiles
                            })
                        ]);
                        return profiles;
                    }),

                    // Search for basic professional information durably
                    ctx.run("search-professional-basic", async () => {
                        const info = await searchProfessionalInfo(initialSearchTerms);
                        // Update progress
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                professionalInfo: info
                            })
                        ]);
                        return info;
                    })
                ]);

                // Update phase to enhanced search
                await ctx.run("update-phase-enhanced", async () => {
                    await adminDb.transact([
                        adminDb.tx.enrichments[enrichmentId].update({
                            phase: 'enhanced_search'
                        })
                    ]);
                });

                // Build refined search terms using discovered information
                const refinedSearchTerms = buildRefinedSearchTerms(personDetails, linkedinProfiles, basicProfessionalInfo);

                // PHASE 2: Enhanced searches using refined information
                const [enhancedProfessionalInfo, recentNews, socialProfiles] = await Promise.all([
                    // Enhanced professional search with refined terms
                    ctx.run("search-professional-enhanced", async () => {
                        const info = await searchProfessionalInfoEnhanced(refinedSearchTerms, basicProfessionalInfo);
                        // Update progress
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                professionalInfo: info
                            })
                        ]);
                        return info;
                    }),

                    // Search for recent news/mentions with refined terms
                    ctx.run("search-news-enhanced", async () => {
                        const news = await searchRecentNewsEnhanced(refinedSearchTerms);
                        // Update progress
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                recentNews: news
                            })
                        ]);
                        return news;
                    }),

                    // Search for other social profiles with refined terms
                    ctx.run("search-social-enhanced", async () => {
                        const profiles = await searchSocialProfilesEnhanced(refinedSearchTerms);
                        // Update progress
                        await adminDb.transact([
                            adminDb.tx.enrichments[enrichmentId].update({
                                socialProfiles: profiles
                            })
                        ]);
                        return profiles;
                    })
                ]);

                // Update phase to summary generation after all searches complete
                await ctx.run("update-phase-summary", async () => {
                    await adminDb.transact([
                        adminDb.tx.enrichments[enrichmentId].update({
                            phase: 'summary_generation'
                        })
                    ]);
                });

                // Generate summary durably
                const summary = await ctx.run("generate-summary", async () => {
                    const summaryText = await generateSummary(initialSearchTerms, {
                        linkedinProfiles,
                        professionalInfo: enhancedProfessionalInfo,
                        recentNews,
                        socialProfiles
                    });
                    // Update with final summary
                    await adminDb.transact([
                        adminDb.tx.enrichments[enrichmentId].update({
                            summary: summaryText,
                            phase: 'completed'
                        })
                    ]);
                    return summaryText;
                });

                const result = {
                    linkedinProfiles,
                    professionalInfo: enhancedProfessionalInfo,
                    recentNews,
                    socialProfiles,
                    summary
                };

                // Mark as completed
                await ctx.run("mark-completed", async () => {
                    await adminDb.transact([
                        adminDb.tx.enrichments[enrichmentId].update({
                            status: 'completed',
                            completedAt: Date.now()
                        })
                    ]);
                });

                return result;
            } catch (error) {
                ctx.console.error("Error enriching person data:", error);

                // Update status to failed
                await ctx.run("mark-failed", async () => {
                    await adminDb.transact([
                        adminDb.tx.enrichments[enrichmentId].update({
                            status: 'failed',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            completedAt: Date.now()
                        })
                    ]);
                });

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
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are an expert investigator specializing in finding accurate LinkedIn profiles. Your goal is to find the most precise matches by cross-referencing multiple data points. Only return LinkedIn URLs that you can verify with high confidence match the person described."
            },
            {
                role: "user",
                content: `Find the most accurate LinkedIn profile(s) for this person: ${searchTerms}

CRITICAL: Use ALL available information to cross-verify the person's identity:
- Cross-reference name with email domain (if email provided)
- Verify company/school matches across sources
- Look for consistent location information
- Check for timeline consistency in career progression
- Only return profiles where multiple data points align

Search strategy:
1. First search using the full name + company/school
2. Cross-check any found profiles against the email domain
3. Verify the person's background matches the provided details
4. Return only profiles with HIGH confidence matches (80%+ certainty)

Return the verified LinkedIn URLs with a brief explanation of why each match is confident.`
            }
        ]
    });

    const responseText = response.output_text || '';

    // Extract LinkedIn URLs from the response
    const linkedinUrls = extractLinkedInUrls(responseText);
    return linkedinUrls;
}

// Helper function to build refined search terms from discovered information
function buildRefinedSearchTerms(
    originalDetails: PersonDetails,
    linkedinProfiles: string[],
    basicProfessionalInfo: { currentRole?: string; company?: string; experience?: string[]; }
): string {
    const refinedTerms = [
        originalDetails.name,
        originalDetails.email,
        // Use discovered company info if available, fallback to original
        basicProfessionalInfo.company || originalDetails.company,
        // Use discovered role info
        basicProfessionalInfo.currentRole,
        originalDetails.school,
        originalDetails.location,
        originalDetails.additionalInfo
    ].filter(Boolean);

    // Add LinkedIn handle if found
    if (linkedinProfiles.length > 0) {
        const linkedinHandle = linkedinProfiles[0].split('/in/')[1]?.replace('/', '');
        if (linkedinHandle) {
            refinedTerms.push(linkedinHandle);
        }
    }

    return refinedTerms.join(' ');
}

// Helper function to search for professional information (basic version)
async function searchProfessionalInfo(searchTerms: string): Promise<{
    currentRole?: string;
    company?: string;
    experience?: string[];
}> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are a professional background researcher. Your task is to find accurate, current professional information by cross-referencing multiple sources to ensure you've identified the correct person."
            },
            {
                role: "user",
                content: `Find current professional information for: ${searchTerms}

ACCURACY REQUIREMENTS:
- Cross-reference information across multiple sources
- Look for consistent patterns (same name + company appearing in multiple places)
- Prioritize recent information (2023-2024) over older data
- Verify person identity using email domain, location, or other provided details

What to find:
1. Current job title and company
2. Recent career history (last 2-3 positions)
3. Professional achievements or notable projects
4. Educational background if relevant

ONLY include information where you can reasonably confirm it belongs to the same person described in the search terms. If you find conflicting information about different people with similar names, clearly distinguish between them or focus on the most likely match based on available data.`
            }
        ]
    });

    const responseText = response.output_text || '';

    // Parse professional information from response
    return parseProfessionalInfo(responseText);
}

// Enhanced professional search using refined terms and basic info
async function searchProfessionalInfoEnhanced(
    refinedSearchTerms: string,
    basicInfo: { currentRole?: string; company?: string; experience?: string[]; }
): Promise<{
    currentRole?: string;
    company?: string;
    experience?: string[];
}> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "high" },
        input: [
            {
                role: "system",
                content: "You are an expert professional researcher conducting a detailed second-pass search. You now have initial information about the person and need to find more comprehensive, verified details."
            },
            {
                role: "user",
                content: `Conduct an enhanced professional search for: ${refinedSearchTerms}

CONTEXT FROM INITIAL SEARCH:
${basicInfo.currentRole ? `- Potential current role: ${basicInfo.currentRole}` : ''}
${basicInfo.company ? `- Potential company: ${basicInfo.company}` : ''}
${basicInfo.experience?.length ? `- Initial experience found: ${basicInfo.experience.slice(0, 2).join(', ')}` : ''}

ENHANCED SEARCH OBJECTIVES:
1. VERIFY the initial findings with additional sources
2. Find more detailed information about their current role and responsibilities
3. Discover recent career moves, promotions, or job changes
4. Look for professional certifications, awards, or recognitions
5. Find company-specific information (team they lead, projects they've worked on)
6. Identify their seniority level and reporting structure if possible

CROSS-VERIFICATION STRATEGY:
- Use the refined search terms to find more specific mentions
- Look for consistency across multiple sources
- If you find conflicting information, note it and explain which seems more reliable
- Focus on information from 2024-2025, then 2023

Provide a comprehensive professional profile with confidence indicators for each piece of information.`
            }
        ]
    });

    const responseText = response.output_text || '';
    return parseProfessionalInfo(responseText);
}

// Enhanced news search using refined terms
async function searchRecentNewsEnhanced(refinedSearchTerms: string): Promise<string[]> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are conducting a targeted news search using refined information about a specific person. You now have better context to distinguish this person from others with similar names."
            },
            {
                role: "user",
                content: `Find recent news and mentions using refined search terms: ${refinedSearchTerms}

ENHANCED SEARCH STRATEGY:
- Use the refined terms (which may include company info, LinkedIn handle, etc.) for more precise searches
- Look for news from 2024-2025 first, then 2023 if needed
- Focus on business news, press releases, and professional announcements
- Cross-reference person details mentioned in articles with the refined search context

Types of content to prioritize:
1. Company announcements featuring this person
2. Industry interviews or quotes
3. Professional achievements, awards, or recognitions
4. Speaking engagements at conferences or events
5. Product launches or business milestones they were involved in
6. Personnel announcements (hiring, promotions, departures)

For each news item, note why you believe it matches the person (leveraging the refined search context) and provide the confidence level.`
            }
        ]
    });

    const responseText = response.output_text || '';
    return parseNewsItems(responseText);
}

// Enhanced social profiles search using refined terms
async function searchSocialProfilesEnhanced(refinedSearchTerms: string): Promise<{
    platform: string;
    url: string;
    confidence: number;
}[]> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are conducting a refined social media search with enhanced context about the person. Use this additional context to find more accurate profile matches and eliminate false positives."
            },
            {
                role: "user",
                content: `Find social media and professional profiles using refined information: ${refinedSearchTerms}

ENHANCED VERIFICATION METHODOLOGY:
- Use the refined search terms (which may include verified company info, LinkedIn handle, etc.)
- Cross-reference profile information with the enhanced context
- Look for bio information, company mentions, or handles that align with the refined data
- Use consistent patterns across platforms (same bio info, linked accounts, etc.)
- Assign higher confidence scores when multiple verification factors align

Platforms to search with enhanced targeting:
1. Twitter/X - look for bio company matches, professional tweets, LinkedIn link in bio
2. GitHub - check for company affiliation in profile, contribution patterns
3. Personal websites or blogs - look for professional info that matches
4. Medium, Dev.to, Substack - professional writing that mentions their work
5. Industry-specific platforms (Dribbble for designers, AngelList for startup folks)

For each profile found, provide:
- Platform name
- URL
- Confidence score (0.1-1.0) with enhanced scoring based on refined context
- Detailed reasoning explaining how the refined search terms helped verify this match

Focus on high-confidence matches using the enhanced context for verification.`
            }
        ]
    });

    const responseText = response.output_text || '';
    return parseSocialProfiles(responseText);
}

// Helper function to search for recent news
async function searchRecentNews(searchTerms: string): Promise<string[]> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are a news researcher focused on finding accurate, recent mentions of specific individuals. You excel at distinguishing between different people with similar names by cross-referencing contextual information."
            },
            {
                role: "user",
                content: `Find recent news and mentions for: ${searchTerms}

VERIFICATION STRATEGY:
- Look for news from 2024-2025 first, then 2023 if needed
- Cross-reference person details (company, location, role) mentioned in articles
- If you find multiple people with similar names, focus on the one that matches the provided context
- Look for patterns: if the same person+company combination appears in multiple articles, that increases confidence

Types of content to find:
1. Press releases or company announcements
2. Industry news or interviews
3. Awards, recognitions, or achievements
4. Speaking engagements or conference appearances
5. Product launches or business milestones

For each news item, briefly note why you believe it matches the person described (e.g., "matches company name and role" or "email domain aligns with organization").`
            }
        ]
    });

    const responseText = response.output_text || '';
    return parseNewsItems(responseText);
}

// Helper function to search for social profiles
async function searchSocialProfiles(searchTerms: string): Promise<{
    platform: string;
    url: string;
    confidence: number;
}[]> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are an expert at finding and verifying social media profiles. You use cross-referencing techniques to ensure the profiles belong to the correct person, not someone else with a similar name."
            },
            {
                role: "user",
                content: `Find social media and professional profiles for: ${searchTerms}

ACCURACY METHODOLOGY:
- Cross-reference profile information with known details (name, company, location, etc.)
- Look for bio information that matches the person's background
- Check for consistent usernames or handles across platforms
- Verify profile photos, company mentions, or location tags align with known info
- Assign confidence scores based on how many data points match

Platforms to search:
1. Twitter/X (look for bio info, company mentions, location)
2. GitHub (check for company affiliation, real name in profile)
3. Personal websites or blogs
4. Other professional platforms (Medium, Dev.to, etc.)

For each profile found, provide:
- Platform name
- URL
- Confidence score (0.1-1.0) based on verification factors
- Brief reasoning for the confidence level

Focus on quality over quantity - better to find 2-3 highly confident matches than 10 uncertain ones.`
            }
        ]
    });

    const responseText = response.output_text || '';
    return parseSocialProfiles(responseText);
}

// Helper function to generate summary
async function generateSummary(searchTerms: string, data: any): Promise<string> {
    const response = await openai.responses.create({
        model: "o4-mini",
        reasoning: { effort: "medium" },
        input: [
            {
                role: "system",
                content: "You are an expert analyst who creates comprehensive professional summaries by synthesizing information from multiple sources. You excel at identifying the most reliable information and noting confidence levels."
            },
            {
                role: "user",
                content: `Create a professional summary for ${searchTerms} based on this gathered information: ${JSON.stringify(data, null, 2)}

SYNTHESIS APPROACH:
1. Identify the most consistent information across sources
2. Note any conflicting information and explain likely reasons
3. Highlight high-confidence facts vs. uncertain information
4. Create a coherent narrative of the person's professional background
5. Include a confidence assessment for key claims

Structure the summary with:
- Current role and company (with confidence level)
- Professional background and experience
- Notable achievements or recent news
- Online presence and social profiles
- Any important caveats or uncertainties

Keep it concise but comprehensive, focusing on the most verified and relevant information.`
            }
        ]
    });

    return response.output_text || 'No summary available';
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