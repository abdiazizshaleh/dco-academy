import { createClient } from "@supabase/supabase-js";
import { parseImport, type State } from "./store";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudClient =
  url && key
    ? createClient(url, key, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
export type CloudRecord = { state: State; revision: number };
export class SaveConflict extends Error {
  constructor() {
    super("A newer copy was saved from another device.");
  }
}
export async function loadCloud(userId: string): Promise<CloudRecord | null> {
  if (!cloudClient) throw new Error("Account storage is not configured.");
  const { data, error } = await cloudClient
    .from("learning_records")
    .select("state,revision")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        state: parseImport(JSON.stringify(data.state)),
        revision: data.revision,
      }
    : null;
}
export async function saveCloud(
  userId: string,
  state: State,
  revision: number,
): Promise<number> {
  if (!cloudClient) throw new Error("Account storage is not configured.");
  const payload = {
    user_id: userId,
    state,
    revision: revision + 1,
    updated_at: new Date().toISOString(),
  };
  if (revision === 0) {
    const { error } = await cloudClient
      .from("learning_records")
      .insert(payload);
    if (error?.code === "23505") throw new SaveConflict();
    if (error) throw error;
  } else {
    const { data, error } = await cloudClient
      .from("learning_records")
      .update(payload)
      .eq("user_id", userId)
      .eq("revision", revision)
      .select("revision");
    if (error) throw error;
    if (!data?.length) throw new SaveConflict();
  }
  return revision + 1;
}
