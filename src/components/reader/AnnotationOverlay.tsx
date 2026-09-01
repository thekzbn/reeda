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
