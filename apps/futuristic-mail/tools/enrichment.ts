import { z } from "zod";
import db from "@/lib/instant_clientside_db";

// Schema for the enrichment tool input
export const enrichmentToolSchema = z.object({
    name: z.string().describe("The person's full name"),
    email: z.string().optional().describe("The person's email address if known"),
    company: z.string().optional().describe("The person's company if known"),
    school: z.string().optional().describe("The person's school/university if known"),
    location: z.string().optional().describe("The person's location if known"),
    additionalInfo: z.string().optional().describe("Any additional information about the person"),
});

export type EnrichmentInput = z.infer<typeof enrichmentToolSchema>;

// Enhanced type for enrichment results with metadata
export interface EnrichmentResultWithMeta {
    id: string;
    personDetails: EnrichmentInput;
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
    status: 'pending' | 'completed' | 'failed';
    createdAt: number;
    completedAt?: number;
    error?: string;
}

// The enrichment tool function
export async function enrichPersonTool(input: EnrichmentInput): Promise<EnrichmentResultWithMeta> {
    const enrichmentId = `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create initial enrichment record with pending status
    const initialRecord = {
        id: enrichmentId,
        personDetails: input,
        linkedinProfiles: [],
        professionalInfo: {},
        recentNews: [],
        socialProfiles: [],
        summary: '',
        status: 'pending' as const,
        createdAt: Date.now(),
    };

    try {
        // Store the initial record in InstantDB
        await db.transact(
            db.tx.enrichments[enrichmentId].update(initialRecord)
        );

        // Call the Restate enrichment service
        const response = await fetch('/restate/v1/enrich/enrichPerson', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(`Enrichment service failed: ${response.statusText}`);
        }

        const enrichmentResult = await response.json();

        // Update the record with completed results
        const completedRecord: EnrichmentResultWithMeta = {
            ...initialRecord,
            ...enrichmentResult,
            status: 'completed',
            completedAt: Date.now(),
        };

        await db.transact(
            db.tx.enrichments[enrichmentId].update(completedRecord)
        );

        return completedRecord;

    } catch (error) {
        console.error('Enrichment failed:', error);

        // Update record with error status
        const errorRecord: EnrichmentResultWithMeta = {
            ...initialRecord,
            status: 'failed',
            completedAt: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error',
        };

        await db.transact(
            db.tx.enrichments[enrichmentId].update(errorRecord)
        );

        return errorRecord;
    }
}

// Helper function to get enrichment by ID
export async function getEnrichment(id: string): Promise<EnrichmentResultWithMeta | null> {
    const result = await db.queryOnce({
        enrichments: {
            $: {
                where: {
                    id: id
                }
            }
        }
    });

    return result.enrichments?.[0] || null;
}

// Helper function to get all enrichments
export async function getAllEnrichments(): Promise<EnrichmentResultWithMeta[]> {
    const result = await db.queryOnce({
        enrichments: {}
    });

    return result.enrichments || [];
}

// Mastra tool definition for the EmailAgent
export const enrichmentMastraTool = {
    enrichPerson: {
        description: "Enrich information about a person by finding their LinkedIn profile, professional information, recent news, and social profiles. This tool searches the web to gather comprehensive information about individuals.",
        schema: enrichmentToolSchema,
        execute: enrichPersonTool,
    },
}; 