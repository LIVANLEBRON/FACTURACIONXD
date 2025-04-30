"use client";

import React from 'react';
import { DataExport } from '@/components/settings/data-export';

export function SettingsClient() {
  return (
    <div className="space-y-4">
      {/* Utilizamos el nuevo componente DataExport que implementa todas las funcionalidades */}
      <DataExport />
    </div>
  );
}