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
 * pdfjs-dist 6.x calls the TC39 "upsert" Map/WeakMap methods
 * (`getOrInsert` / `getOrInsertComputed`). They are still unshipped in most
 * browsers, and without them every page render rejects with
 * "getOrInsertComputed is not a function", which leaves the canvas blank and
 * prevents the text layer (and therefore text selection and annotations) from
 * ever being created.
 */

type UpsertMap<K, V> = {
  has(key: K): boolean;
  get(key: K): V | undefined;
  set(key: K, value: V): unknown;
  getOrInsert?(key: K, value: V): V;
  getOrInsertComputed?(key: K, callback: (key: K) => V): V;
};

function patch(proto: UpsertMap<unknown, unknown> | undefined): void {
  if (!proto) return;

  if (typeof proto.getOrInsert !== "function") {
    Object.defineProperty(proto, "getOrInsert", {
      configurable: true,
      writable: true,
      value: function (this: UpsertMap<unknown, unknown>, key: unknown, value: unknown) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }

  if (typeof proto.getOrInsertComputed !== "function") {
    Object.defineProperty(proto, "getOrInsertComputed", {
      configurable: true,
      writable: true,
      value: function (
        this: UpsertMap<unknown, unknown>,
        key: unknown,
        callback: (key: unknown) => unknown,
      ) {
        if (!this.has(key)) this.set(key, callback(key));
        return this.get(key);
      },
    });
  }
}

patch(Map.prototype as unknown as UpsertMap<unknown, unknown>);
patch(WeakMap.prototype as unknown as UpsertMap<unknown, unknown>);

export {};
