import { reedaStorage } from "./reeda-storage";
import type { StorageProvider, StorageProviderId } from "./types";

export * from "./types";

const providers: Partial<Record<StorageProviderId, StorageProvider>> = {
  reeda: reedaStorage,
};

export const defaultStorageProviderId: StorageProviderId = "reeda";

export function getStorageProvider(id: StorageProviderId = defaultStorageProviderId) {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Storage provider "${id}" is not available.`);
  }
  return provider;
}
