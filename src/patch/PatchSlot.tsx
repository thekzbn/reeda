/*
 * Reeda Plugin Slot (powered by patch.md)
 * Mounts active and enabled plugins into host-declared abstract slot regions.
 */

import React, { useEffect, useState } from 'react';
import { pluginHost } from './patch-host';
import { PLUGIN_WIDGET_REGISTRY } from './PatchWidgets';
import type { ReedaSlotId, PluginExecutionContext, ReedaPluginManifest } from './types';

interface PatchSlotProps {
  slotId: ReedaSlotId;
  context?: PluginExecutionContext;
  className?: string;
}

export function PatchSlot({ slotId, context, className }: PatchSlotProps) {
  const [plugins, setPlugins] = useState<ReedaPluginManifest[]>(() =>
    pluginHost.getBySlot(slotId)
  );

  useEffect(() => {
    const unsubscribe = pluginHost.subscribe(() => {
      setPlugins(pluginHost.getBySlot(slotId));
    });
    return unsubscribe;
  }, [slotId]);

  if (plugins.length === 0) {
    return null;
  }

  return (
    <div className={`reeda-plugin-slot flex items-center gap-2 ${className || ''}`} data-slot-id={slotId}>
      {plugins.map(plugin => {
        const WidgetComponent = PLUGIN_WIDGET_REGISTRY[plugin.ui_component_name];
        if (!WidgetComponent) return null;

        return (
          <div
            key={plugin.id}
            className="reeda-plugin-container"
            data-plugin-id={plugin.id}
            data-status={plugin.status}
          >
            <WidgetComponent context={context} />
          </div>
        );
      })}
    </div>
  );
}

export const PluginSlot = PatchSlot;
