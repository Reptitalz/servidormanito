
import { NextRequest, NextResponse } from 'next/server';
import { formidable } from 'formidable';
import fs from 'fs/promises';
import { assistantFlow } from '@/ai/flows/assistant-flow';

export async function POST(req: NextRequest) {
  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req as any);

    const message = fields.message?.[0];
    const audioFile = files.audio?.[0];
    const from = fields.from?.[0];

    if (!message && !audioFile) {
      return NextResponse.json({ error: 'No message or audio provided' }, { status: 400 });
    }
    
    if (!from) {
        return NextResponse.json({ error: 'No sender information provided' }, { status: 400 });
    }

    let inputText = message;
    let inputAudio: string | undefined;

    if (audioFile) {
      const audioBuffer = await fs.readFile(audioFile.filepath);
      const mimeType = audioFile.mimetype || 'audio/wav';
      inputAudio = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
    }

    // Call the unified assistant flow
    const response = await assistantFlow({
        userId: from, // Use 'from' as a unique identifier for the user
        text: inputText,
        audio: inputAudio,
    });

    // The response contains the AI's text reply and the path to the audio file
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal ServerError', details: error.message }, { status: 500 });
  }
}
