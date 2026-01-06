import { NextRequest, NextResponse } from "next/server";
import { processAudioTranscription } from "@/lib/transcribe/processAudioTranscription";

/**
 * POST /api/transcribe
 *
 * Transcribes audio using OpenAI Whisper and saves both the original audio
 * and transcript markdown to the customer's files.
 *
 * Request body:
 * - audio_url: URL to the audio file (required)
 * - account_id: Owner account ID (required)
 * - artist_account_id: Artist account ID for file storage (required)
 * - title: Title for the transcription (optional)
 * - include_timestamps: Include timestamps in transcript (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio_url, account_id, artist_account_id, title, include_timestamps } = body;

    // Validate required fields
    if (!audio_url) {
      return NextResponse.json({ error: "Missing required field: audio_url" }, { status: 400 });
    }
    if (!account_id) {
      return NextResponse.json({ error: "Missing required field: account_id" }, { status: 400 });
    }
    if (!artist_account_id) {
      return NextResponse.json(
        { error: "Missing required field: artist_account_id" },
        { status: 400 },
      );
    }

    const result = await processAudioTranscription({
      audioUrl: audio_url,
      ownerAccountId: account_id,
      artistAccountId: artist_account_id,
      title,
      includeTimestamps: include_timestamps,
    });

    return NextResponse.json({
      success: true,
      audioFile: result.audioFile,
      transcriptFile: result.transcriptFile,
      text: result.text,
      language: result.language,
    });
  } catch (error) {
    console.error("Transcription error:", error);

    let errorMessage = error instanceof Error ? error.message : "Transcription failed";
    let status = 500;

    // Handle specific error cases
    if (errorMessage.includes("OPENAI_API_KEY")) {
      errorMessage = "OpenAI API key is not configured";
      status = 500;
    } else if (errorMessage.includes("fetch audio")) {
      errorMessage = "Could not fetch the audio file. Please check the URL is accessible.";
      status = 400;
    } else if (errorMessage.includes("25 MB") || errorMessage.includes("file size")) {
      errorMessage = "Audio file exceeds the 25MB limit";
      status = 413;
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

