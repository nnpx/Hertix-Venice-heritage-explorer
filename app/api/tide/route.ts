import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://dati.venezia.it/sites/default/files/dataset/opendata/livello.json', {
            // 2.  Next.js config: Tell it NOT to cache this so we always get live water levels
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Venice API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // 3. Send the data back to our frontend
        return NextResponse.json(data);

    } catch (error) {
        console.error("Tide Proxy Error:", error);
        return NextResponse.json(
            { error: 'Failed to fetch tide data from Venice API' },
            { status: 500 }
        );
    }
}