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
