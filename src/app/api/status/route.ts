
import { NextResponse } from 'next/server';

const GATEWAY_URL = 'https://servidormanito-7-west1.run.app';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assistantId = searchParams.get('assistantId');

  if (!assistantId) {
    return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/status?assistantId=${assistantId}`);
    if (!response.ok) {
      throw new Error(`Gateway responded with status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error proxying status request to gateway:", error.message);
    return NextResponse.json({ error: 'Could not fetch status from gateway' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ message: "This endpoint is deprecated.", status: 410 });
}
