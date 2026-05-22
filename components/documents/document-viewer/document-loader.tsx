'use client'

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
import { useEffect, useRef } from 'react';

type DocumentLoaderProps = {
  documentId: string;
  fileName: string;
  onError: (message: string) => void;
}

export const DocumentLoader = ({
  documentId,
  fileName,
  onError,
}: DocumentLoaderProps) => {
  const { provides: documentManager } = useDocumentManagerCapability();
  const loadedDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!documentManager) {
      return;
    }

    if (loadedDocumentIdRef.current === documentId) {
      return;
    }

    loadedDocumentIdRef.current = documentId;

    const load = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/file`, {
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PDF file');
        }

        const buffer = await response.arrayBuffer();

        await documentManager.openDocumentBuffer({
          buffer,
          name: fileName,
          autoActivate: true,
        });
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Failed to load document',
        );
      }
    };

    void load();
  }, [documentId, documentManager, fileName, onError]);

  return null;
};
