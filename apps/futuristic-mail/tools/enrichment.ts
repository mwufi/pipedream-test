import { z } from "zod";
import db from "@/lib/instant_clientside_db";
import { id } from "@instantdb/react";

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
    const enrichmentId = id()

    // Create initial enrichment record with pending status
    const initialRecord = {
        id: enrichmentId,
        personDetails: JSON.stringify(input),
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

        // Get the Restate ingress URL from environment variable
        const restateIngressUrl = process.env.NEXT_PUBLIC_RESTATE_INGRESS_URL || 'http://localhost:8080';

        // Call the Restate enrichment service
        const response = await fetch(`${restateIngressUrl}/enrich/enrichPerson`, {
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