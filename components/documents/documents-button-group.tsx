"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { ViewMode } from "@/lib/documents"

type ButtonGroupProps = {
  buttons: { value: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[]
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function DocumentsButtonGroup({ buttons, value, onChange }: ButtonGroupProps) {
  return (
    <ButtonGroup className="rounded-lg border bg-muted p-0.5">
      {buttons.map((button) => (
        <Button
          key={button.value}
          variant={value === button.value ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3"
          onClick={() => onChange(button.value)}
          aria-label={button.label}
        >
          <button.icon />
        </Button>
      ))}
    </ButtonGroup>
  )
}
