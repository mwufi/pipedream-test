import { NextRequest, NextResponse } from 'next/server';

const MEILISEARCH_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || 'your-master-key';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Forward all search parameters to Meilisearch
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            params.append(key, value);
        });

        const response = await fetch(
            `${MEILISEARCH_URL}/indexes/emails/search?${params}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Meilisearch request failed: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Email search error:', error);
        return NextResponse.json(
            { error: 'Failed to search emails' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(
            `${MEILISEARCH_URL}/indexes/emails/search`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            throw new Error(`Meilisearch request failed: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Email search error:', error);
        return NextResponse.json(
            { error: 'Failed to search emails' },
            { status: 500 }
        );
    }
} 