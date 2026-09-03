/*
 * Reeda - a reading environment for PDFs.
 * Copyright (C) 2026 Quing (thekzbn)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { supabase } from "@/integrations/supabase/client";
import { StorageError, type StorageProvider, type StoredFile, type UploadInput } from "./types";

const BUCKET = "documents";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export const reedaStorage: StorageProvider = {
  id: "reeda",
  label: "Reeda Storage",

  async upload({ file, ownerId }: UploadInput): Promise<StoredFile> {
    const path = `${ownerId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) {
      throw new StorageError("We could not upload that file. Please try again.");
    }
    return { storageRef: path, size: file.size, contentType: "application/pdf" };
  },

  async getReadUrl(storageRef: string, expiresInSeconds = 600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storageRef, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new StorageError("We could not open that file right now.");
    }
    return data.signedUrl;
  },

  async remove(storageRef: string): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET).remove([storageRef]);
    if (error) {
      throw new StorageError("We could not remove that file. Please try again.");
    }
  },

  async usedBytes(ownerId: string): Promise<number> {
    const { data, error } = await supabase
      .from("documents")
      .select("file_size")
      .eq("user_id", ownerId);
    if (error) return 0;
    return (data ?? []).reduce((total, row) => total + Number(row.file_size ?? 0), 0);
  },
};
