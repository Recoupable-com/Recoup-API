import { transcribeAudio } from "./transcribeAudio";
import { formatTranscriptMd } from "./formatTranscriptMd";
import { saveAudioToFiles } from "./saveAudioToFiles";
import { saveTranscriptToFiles } from "./saveTranscriptToFiles";
import { ProcessTranscriptionParams, ProcessTranscriptionResult } from "./types";

/**
 * Main orchestrator: fetches audio, saves it, transcribes, and saves transcript.
 * Both files are saved to the customer's files.
 *
 * @param params - Audio URL and account information
 * @returns Result with both file records and transcription text
 */
export async function processAudioTranscription(
  params: ProcessTranscriptionParams,
): Promise<ProcessTranscriptionResult> {
  const { audioUrl, ownerAccountId, artistAccountId, title, includeTimestamps } = params;

  // 1. Fetch the audio file from URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }
  const audioBlob = await response.blob();
  const contentType = response.headers.get("content-type") || "audio/mpeg";

  // Determine file extension from content type
  let ext = "mp3";
  if (contentType.includes("wav")) ext = "wav";
  else if (contentType.includes("m4a") || contentType.includes("mp4")) ext = "m4a";
  else if (contentType.includes("webm")) ext = "webm";

  const safeTitle = (title || "audio").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${safeTitle}.${ext}`;

  // 2. Save the original audio file
  const audioFileRecord = await saveAudioToFiles({
    audioBlob,
    contentType,
    fileName,
    ownerAccountId,
    artistAccountId,
    title,
    tags: ["audio", "original"],
  });

  // 3. Transcribe using OpenAI Whisper
  const transcription = await transcribeAudio(audioBlob, fileName);

  // 4. Format as markdown
  const markdown = formatTranscriptMd(transcription, {
    title,
    includeTimestamps,
  });

  // 5. Save the transcript
  const transcriptFileRecord = await saveTranscriptToFiles({
    markdown,
    ownerAccountId,
    artistAccountId,
    title,
    tags: ["transcription", "generated"],
  });

  return {
    audioFile: {
      id: audioFileRecord.id,
      fileName: audioFileRecord.file_name,
      storageKey: audioFileRecord.storage_key,
    },
    transcriptFile: {
      id: transcriptFileRecord.id,
      fileName: transcriptFileRecord.file_name,
      storageKey: transcriptFileRecord.storage_key,
    },
    text: transcription.text,
    language: transcription.language,
  };
}

