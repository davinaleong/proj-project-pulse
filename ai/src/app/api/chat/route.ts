import { NextRequest, NextResponse } from 'next/server';
import { askQuestion } from '../../scripts/search';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Call the Azure AI Search function server-side where env vars are available
    const response = await askQuestion(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}