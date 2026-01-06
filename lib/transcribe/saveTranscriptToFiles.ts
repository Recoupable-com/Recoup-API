import supabase from "@/lib/supabase/serverClient";
import { SaveTranscriptParams, FileRecord, STORAGE_BUCKET } from "./types";

export async function saveTranscriptToFiles(params: SaveTranscriptParams): Promise<FileRecord> {
  const { markdown, ownerAccountId, artistAccountId, title = "Transcription" } = params;

  const safeTitle = title.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${safeTitle}-transcript.md`;
  const storageKey = `files/${ownerAccountId}/${artistAccountId}/${fileName}`;

  const markdownBlob = new Blob([markdown], { type: "text/markdown" });
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storageKey, markdownBlob, {
      contentType: "text/markdown",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload transcript: ${uploadError.message}`);
  }

  const { data, error: insertError } = await supabase
    .from("files")
    .insert({
      owner_account_id: ownerAccountId,
      artist_account_id: artistAccountId,
      storage_key: storageKey,
      file_name: fileName,
      mime_type: "text/markdown",
      size_bytes: new TextEncoder().encode(markdown).length,
      description: `Transcript for "${title}"`,
      tags: params.tags || ["transcription"],
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create file record: ${insertError.message}`);
  }

  return data;
}

