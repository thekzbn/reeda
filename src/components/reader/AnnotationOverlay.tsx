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

import type { DocumentAnnotation } from "./types";

export function AnnotationOverlay({ annotations }: { annotations: DocumentAnnotation[] }) {
  return (
    <div className="annotationLayer" aria-hidden="true">
      {annotations.flatMap((annotation) =>
        annotation.geometry.rects.map((rect, index) => (
          <div
            key={`${annotation.id}-${index}`}
            className={`pdf-annotation pdf-annotation--${annotation.type}`}
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
            }}
          />
        )),
      )}
    </div>
  );
}
