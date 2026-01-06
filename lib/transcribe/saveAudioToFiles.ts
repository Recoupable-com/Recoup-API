import supabase from "@/lib/supabase/serverClient";
import { SaveAudioParams } from "./types";

const SUPABASE_STORAGE_BUCKET = "user-files";

interface FileRecord {
  id: string;
  file_name: string;
  storage_key: string;
}

/**
 * Saves audio blob to customer files (storage + database record).
 *
 * @param params - Audio file and account information
 * @returns The created file record
 */
export async function saveAudioToFiles(params: SaveAudioParams): Promise<FileRecord> {
  const { audioBlob, contentType, fileName, ownerAccountId, artistAccountId, title = "Audio" } =
    params;

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `files/${ownerAccountId}/${artistAccountId}/${safeFileName}`;

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storageKey, audioBlob, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // 2. Create database record
  const { data, error: insertError } = await supabase
    .from("files")
    .insert({
      owner_account_id: ownerAccountId,
      artist_account_id: artistAccountId,
      storage_key: storageKey,
      file_name: safeFileName,
      mime_type: contentType,
      size_bytes: audioBlob.size,
      description: `Audio file: "${title}"`,
      tags: params.tags || ["audio"],
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create file record: ${insertError.message}`);
  }

  return data;
}

