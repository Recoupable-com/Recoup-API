/**
 * Types for the audio transcription feature.
 * Used by transcribeAudio, formatTranscriptMd, and related functions.
 */

export interface TranscriptionResult {
  text: string;
  chunks?: { timestamp: [number, number]; text: string }[];
  language?: string;
}

export interface TranscriptMdOptions {
  title?: string;
  includeTimestamps?: boolean;
}

export interface SaveFileParams {
  ownerAccountId: string;
  artistAccountId: string;
  title?: string;
  tags?: string[];
}

export interface SaveAudioParams extends SaveFileParams {
  audioBlob: Blob;
  contentType: string;
  fileName: string;
}

export interface SaveTranscriptParams extends SaveFileParams {
  markdown: string;
}

export interface ProcessTranscriptionParams {
  audioUrl: string;
  ownerAccountId: string;
  artistAccountId: string;
  title?: string;
  includeTimestamps?: boolean;
}

export interface FileInfo {
  id: string;
  fileName: string;
  storageKey: string;
}

export interface ProcessTranscriptionResult {
  audioFile: FileInfo;
  transcriptFile: FileInfo;
  text: string;
  language?: string;
}

