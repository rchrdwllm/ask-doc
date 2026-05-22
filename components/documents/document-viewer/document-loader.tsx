'use client'

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
import { useEffect, useRef } from 'react';
import { client } from '@/lib/api';

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

    const fetchSignedUrl = async () => {
      const { data, error } = await client.documents({ id: documentId }).url.get();

      if (error) {
        throw new Error(error.value.message ?? 'Failed to fetch signed URL');
      }

      if (!data?.url) {
        throw new Error('Signed URL missing');
      }

      return data.url;
    };

    const load = async () => {
      try {
        const signedUrl = await fetchSignedUrl();

        await documentManager.openDocumentUrl({
          url: signedUrl,
          name: fileName,
          autoActivate: true,
        });
      } catch (error) {
        try {
          const signedUrl = await fetchSignedUrl();

          await documentManager.openDocumentUrl({
            url: signedUrl,
            name: fileName,
            autoActivate: true,
          });
        } catch (retryError) {
          onError(
            retryError instanceof Error
              ? retryError.message
              : 'Failed to load document',
          );
        }
      }
    };

    void load();
  }, [documentId, documentManager, fileName, onError]);

  return null;
};
