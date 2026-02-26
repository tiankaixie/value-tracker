"use client";

import { Button } from "@cloudflare/kumo";
import { DownloadSimple } from "@phosphor-icons/react";
import type { Item } from "@/lib/types";
import { exportJSON, exportCSV } from "@/lib/storage";

interface ExportButtonsProps {
  items: Item[];
}

export default function ExportButtons({ items }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={DownloadSimple}
        onClick={() => exportJSON(items)}
      >
        JSON
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={DownloadSimple}
        onClick={() => exportCSV(items)}
      >
        CSV
      </Button>
    </div>
  );
}
