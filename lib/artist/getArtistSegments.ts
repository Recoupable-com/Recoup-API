import { selectArtistSegmentsCount } from "@/lib/supabase/artist_segments/selectArtistSegmentsCount";
import { selectArtistSegments } from "@/lib/supabase/artist_segments/selectArtistSegments";
import type { ArtistSegmentsQuery } from "@/lib/artist/validateArtistSegmentsQuery";

interface GetArtistSegmentsResponse {
  status: "success" | "error";
  segments: {
    id: string;
    artist_account_id: string;
    segment_id: string;
    updated_at: string;
    segment_name: string;
    artist_name: string;
  }[];
  pagination: {
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  message?: string;
}

export const getArtistSegments = async ({
  artist_account_id,
  page,
  limit,
}: ArtistSegmentsQuery): Promise<GetArtistSegmentsResponse> => {
  try {
    const offset = (page - 1) * limit;

    // Get total count first
    const total_count = await selectArtistSegmentsCount(artist_account_id);

    if (total_count === 0) {
      return {
        status: "success",
        segments: [],
        pagination: {
          total_count: 0,
          page,
          limit,
          total_pages: 0,
        },
      };
    }

    // Get paginated segments with joins
    const data = await selectArtistSegments(artist_account_id, offset, limit);

    if (!data) {
      return {
        status: "success",
        segments: [],
        pagination: {
          total_count: 0,
          page,
          limit,
          total_pages: 0,
        },
      };
    }

    const formattedSegments = data.map(segment => ({
      id: segment.id,
      artist_account_id: segment.artist_account_id,
      segment_id: segment.segment_id,
      updated_at: segment.updated_at || new Date().toISOString(),
      segment_name: segment.segments?.name || "Unknown Segment",
      artist_name: segment.accounts?.name || "Unknown Artist",
    }));

    const total_pages = Math.ceil(total_count / limit);

    return {
      status: "success",
      segments: formattedSegments,
      pagination: {
        total_count,
        page,
        limit,
        total_pages,
      },
    };
  } catch (error) {
    console.error("[ERROR] Error in getArtistSegments:", error);
    throw error;
  }
};
