import supabase from "../serverClient";
import { Tables } from "@/types/database.types";

interface CreateRoomParams {
  account_id: string;
  topic: string;
  artist_id?: string;
}

export const insertRoom = async (params: CreateRoomParams): Promise<Tables<"rooms">> => {
  const { data, error } = await supabase.from("rooms").insert(params).select("*").single();

  if (error) throw error;

  return data;
};
