import { supabase } from "@/integrations/supabase/client";

export type ThemeMode = "light" | "dark" | "system";

export interface Profile {
  id: string;
  display_name: string | null;
  role_type: string | null;
  field: string | null;
  purpose: string | null;
  reading_types: string[];
  current_tools: string[];
  onboarding_completed: boolean;
  storage_quota_bytes: number;
  theme: ThemeMode;
  resume_reading: boolean;
  export_include_source: boolean;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return null;

  if (!data) {
    // Safety net if the account predates the automatic profile creation.
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("*")
      .maybeSingle();
    return (created as Profile | null) ?? null;
  }

  return data as Profile;
}

export interface ProfileSetupAnswers {
  role_type: string;
  field: string;
  purpose: string;
  reading_types: string[];
  current_tools: string[];
}

export async function saveProfileSetup(answers: ProfileSetupAnswers): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Your session has expired. Please sign in again.");

  const { error } = await supabase
    .from("profiles")
    .update({ ...answers, onboarding_completed: true })
    .eq("id", user.id);

  if (error) throw new Error("We could not save your answers. Please try again.");
}

export async function updateMyProfile(
  updates: Partial<Omit<Profile, "id" | "storage_quota_bytes">>,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Your session has expired. Please sign in again.");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) throw new Error("We could not save your changes. Please try again.");
}

export async function deleteMyAccount(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Your session has expired. Please sign in again.");

  // 1. Fetch all user documents to remove underlying storage files and records
  const { data: userDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id);

  if (userDocs && userDocs.length > 0) {
    const { getStorageProvider } = await import("@/lib/storage");
    for (const doc of userDocs) {
      // Remove file from storage
      try {
        const storage = getStorageProvider(doc.storage_provider as "reeda");
        await storage.remove(doc.storage_ref);
      } catch {
        // Storage cleanup best effort
      }
    }

    // Delete document records (cascades notes and annotations)
    await supabase.from("documents").delete().eq("user_id", user.id);
  }

  // 2. Clear annotations and notes explicitly in case any orphaned
  await supabase.from("document_annotations").delete().eq("user_id", user.id);
  await supabase.from("document_notes").delete().eq("user_id", user.id);

  // 3. Clear profile content
  await supabase
    .from("profiles")
    .update({
      display_name: null,
      role_type: null,
      field: null,
      purpose: null,
      reading_types: [],
      current_tools: [],
      onboarding_completed: false,
    })
    .eq("id", user.id);

  // 4. Sign out the user
  await supabase.auth.signOut();
}
