/*
 * PatchSlot component for Reeda
 * Renders dynamically registered and active patch widgets inside abstract slot identifiers.
 */

import React, { useEffect, useState } from 'react';
import { patchHost } from './patch-host';
import { PATCH_WIDGET_REGISTRY } from './PatchWidgets';
import type { ReedaSlotId, PatchExecutionContext, ReedaPatchManifest } from './types';

interface PatchSlotProps {
  slotId: ReedaSlotId;
  context?: PatchExecutionContext;
  className?: string;
}

export function PatchSlot({ slotId, context, className }: PatchSlotProps) {
  const [patches, setPatches] = useState<ReedaPatchManifest[]>(() =>
    patchHost.getBySlot(slotId)
  );

  useEffect(() => {
    const unsubscribe = patchHost.subscribe(() => {
      setPatches(patchHost.getBySlot(slotId));
    });
    return unsubscribe;
  }, [slotId]);

  if (patches.length === 0) {
    return null;
  }

  return (
    <div className={`patch-slot flex items-center gap-2 ${className || ''}`} data-slot-id={slotId}>
      {patches.map(patch => {
        const WidgetComponent = PATCH_WIDGET_REGISTRY[patch.ui_component_name];
        if (!WidgetComponent) return null;

        return (
          <div
            key={patch.patch_id}
            className="patch-module-container"
            data-patch-id={patch.patch_id}
            data-status={patch.status}
          >
            <WidgetComponent context={context} />
          </div>
        );
      })}
    </div>
  );
}
