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

/**
 * Storage service abstraction.
 *
 * The document library and the future PDF reader talk to a StorageProvider,
 * never to a backend storage SDK directly. Additional providers (Google Drive,
 * OneDrive) can be added later by implementing this interface and registering
 * them in ./index.ts.
 */

export type StorageProviderId = "reeda" | "google-drive" | "onedrive";

export interface StoredFile {
  /** Provider-scoped reference used to fetch or delete the file later. */
  storageRef: string;
  size: number;
  contentType: string;
}

export interface UploadInput {
  file: File;
  /** Owner of the file, resolved from the authenticated session, never the client form. */
  ownerId: string;
}

export interface StorageProvider {
  readonly id: StorageProviderId;
  readonly label: string;
  upload(input: UploadInput): Promise<StoredFile>;
  /** Short-lived authenticated URL for reading a private file. */
  getReadUrl(storageRef: string, expiresInSeconds?: number): Promise<string>;
  remove(storageRef: string): Promise<void>;
  /** Total bytes stored by the owner with this provider. */
  usedBytes(ownerId: string): Promise<number>;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}
