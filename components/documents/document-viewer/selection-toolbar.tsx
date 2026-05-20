import { useState, useEffect } from 'react';
import { useSelectionCapability, SelectionRangeX, type SelectionSelectionMenuProps } from '@embedpdf/plugin-selection/react';

type SelectionToolbarProps = {
  documentId: string;
}

export const SelectionToolbar = ({ documentId }: SelectionToolbarProps) => {
  const { provides: selectionCapability } = useSelectionCapability();
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    if (!selectionCapability) return;
    const selection = selectionCapability.forDocument(documentId);

    return selection.onSelectionChange((sel: SelectionRangeX | null) => {
      setHasSelection(!!sel);
    });
  }, [selectionCapability, documentId]);

  const handleCopy = () => {
    selectionCapability?.forDocument(documentId).copyToClipboard();
  };

  return <button onClick={handleCopy} disabled={!hasSelection}>Copy</button>;
};

export const TextSelectionMenu = ({
  rect,
  menuWrapperProps,
  placement,
  documentId
}: SelectionSelectionMenuProps & { documentId: string }) => {
  const { provides: selectionCapability } = useSelectionCapability();

  const handleCopy = () => {
    const scope = selectionCapability?.forDocument(documentId);
    scope?.copyToClipboard();
    scope?.clear(); // Clear selection after copying
  };

  // Position above or below based on available space
  const top = placement.suggestTop ? -48 : rect.size.height + 8;

  return (
    <div {...menuWrapperProps}>
      <div style={{ position: 'absolute', top, pointerEvents: 'auto', cursor: 'default' }}>
        <button onClick={handleCopy}>Copy</button>
      </div>
    </div>
  );
};