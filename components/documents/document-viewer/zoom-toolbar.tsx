import { useZoom } from '@embedpdf/plugin-zoom/react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Separator } from '@/components/ui/separator';

interface ZoomToolbarProps {
  documentId: string;
}

export const ZoomToolbar = ({ documentId }: ZoomToolbarProps) => {
  const { provides: zoomProvides, state: zoomState } = useZoom(documentId);

  if (!zoomProvides) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-background p-4 flex items-center gap-4">
      <p className="text-sm text-muted-foreground">Zoom</p>
      <Separator
        className="h-4 data-[orientation=vertical]:self-center"
        orientation="vertical"
      />
      <ButtonGroup>
        <Button onClick={zoomProvides.zoomOut} size="icon" variant="outline">
          <Minus data-icon="inline-start" />
        </Button>
        <Button onClick={zoomProvides.zoomIn} size="icon" variant="outline">
          <Plus data-icon="inline-start" />
        </Button>
        <Button onClick={() => zoomProvides.requestZoom(1.0)} variant="outline">
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </ButtonGroup>
    </div>
  );
};