import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { processAudioTranscription } from "@/lib/transcribe/processAudioTranscription";
import { getToolResultSuccess } from "@/lib/mcp/getToolResultSuccess";
import { getToolResultError } from "@/lib/mcp/getToolResultError";

const transcribeAudioSchema = z.object({
  audio_url: z.string().url().describe("URL to the audio file (mp3, wav, m4a, webm)"),
  account_id: z.string().uuid().describe("Owner account ID"),
  artist_account_id: z.string().uuid().describe("Artist account ID for file storage"),
  title: z.string().optional().describe("Title for the transcription (used in filename)"),
  include_timestamps: z.boolean().optional().describe("Include timestamps in the transcript"),
});

type TranscribeAudioArgs = z.infer<typeof transcribeAudioSchema>;

/**
 * Registers the "transcribe_audio" tool on the MCP server.
 * Transcribes audio using OpenAI Whisper and saves both the audio and transcript
 * to the customer's files.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerTranscribeAudioTool(server: McpServer): void {
  server.registerTool(
    "transcribe_audio",
    {
      description:
        "Transcribe audio (music, podcast, voice memo) using OpenAI Whisper. Saves both the original audio file and the transcript markdown to the customer's files.",
      inputSchema: transcribeAudioSchema,
    },
    async (args: TranscribeAudioArgs) => {
      try {
        const result = await processAudioTranscription({
          audioUrl: args.audio_url,
          ownerAccountId: args.account_id,
          artistAccountId: args.artist_account_id,
          title: args.title,
          includeTimestamps: args.include_timestamps,
        });

        const response = {
          success: true,
          message: `Saved "${result.audioFile.fileName}" and "${result.transcriptFile.fileName}"`,
          audioFile: result.audioFile,
          transcriptFile: result.transcriptFile,
          text: result.text,
          language: result.language,
        };

        return getToolResultSuccess(response);
      } catch (error) {
        console.error("Error transcribing audio:", error);

        let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

        // Format helpful error messages
        if (errorMessage.includes("OPENAI_API_KEY")) {
          errorMessage = "OpenAI API key is missing. Please check environment variables.";
        } else if (errorMessage.includes("rate limit")) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (errorMessage.includes("fetch audio")) {
          errorMessage = "Could not fetch the audio file. Please check the URL is accessible.";
        } else if (errorMessage.includes("25 MB") || errorMessage.includes("file size")) {
          errorMessage = "Audio file is too large. OpenAI Whisper has a 25MB limit.";
        }

        return getToolResultError(`Failed to transcribe audio. ${errorMessage}`);
      }
    },
  );
}

