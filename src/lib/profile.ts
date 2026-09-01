import { supabase } from "@/integrations/supabase/client";

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
