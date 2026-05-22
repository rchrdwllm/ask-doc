'use client'

import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';

// Import the essential plugins
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import {
  DocumentContent,
  DocumentManagerPluginPackage,
} from '@embedpdf/plugin-document-manager/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';
import { ZoomPluginPackage, ZoomMode } from '@embedpdf/plugin-zoom/react';
import { ZoomToolbar } from './zoom-toolbar';
import { SelectionLayer, SelectionPluginPackage } from '@embedpdf/plugin-selection/react';
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useEffect, useState } from 'react';
import { DocumentLoader } from './document-loader';

// 1. Register the plugins you need
const plugins = [
  createPluginRegistration(DocumentManagerPluginPackage),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
  createPluginRegistration(ZoomPluginPackage, {
    defaultZoomLevel: ZoomMode.FitPage,
  }),
  createPluginRegistration(InteractionManagerPluginPackage),
  createPluginRegistration(SelectionPluginPackage),
];

type PDFViewerProps = {
  documentId: string;
  fileName: string;
}

export const PDFViewer = ({ documentId, fileName }: PDFViewerProps) => {
  // 2. Initialize the engine with the React hook
  const { engine, isLoading } = usePdfiumEngine();
  const [loadError, setLoadError] = useState<string | null>(null);
  const handleLoadError = useCallback((message: string) => {
    setLoadError(message);
  }, []);

  useEffect(() => {
    setLoadError(null);
  }, [documentId]);

  if (isLoading || !engine) {
    return (
      <div className="p-4 h-full">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  // 3. Wrap your UI with the <EmbedPDF> provider
  return (
    <div className="h-full flex flex-col bg-muted rounded-bl-xl">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) => (
          <>
            <DocumentLoader
              documentId={documentId}
              fileName={fileName}
              onError={handleLoadError}
            />
            {activeDocumentId ? (
              <DocumentContent documentId={activeDocumentId}>
                {({ isLoaded, isLoading, isError }) => (
                  <>
                    {isLoading && (
                      <div className="p-4 h-full">
                        <Skeleton className="h-full w-full" />
                      </div>
                    )}
                    {loadError ? (
                      <div className="p-4 h-full">
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted text-sm text-muted-foreground">
                          {loadError}
                        </div>
                      </div>
                    ) : null}
                    {isError && !loadError && (
                      <div className="p-4 h-full">
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted text-sm text-muted-foreground">
                          Failed to render PDF.
                        </div>
                      </div>
                    )}
                    {isLoaded && (
                      <div className="flex flex-col relative flex-1 min-h-0">
                        <ZoomToolbar documentId={activeDocumentId} />
                        <Viewport documentId={activeDocumentId}>
                          <Scroller
                            documentId={activeDocumentId}
                            renderPage={({ width, height, pageIndex }) => (
                              <div style={{ width, height }}>
                                {/* The RenderLayer is responsible for drawing the page */}
                                <RenderLayer
                                  documentId={activeDocumentId}
                                  pageIndex={pageIndex}
                                />
                                <SelectionLayer
                                  documentId={activeDocumentId}
                                  pageIndex={pageIndex}
                                />
                              </div>
                            )}
                          />
                        </Viewport>
                      </div>
                    )}
                  </>
                )}
              </DocumentContent>
            ) : loadError ? (
              <div className="p-4 h-full">
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted text-sm text-muted-foreground">
                  {loadError}
                </div>
              </div>
            ) : (
              <div className="p-4 h-full">
                <Skeleton className="h-full w-full" />
              </div>
            )}
          </>
        )}
      </EmbedPDF>
    </div>
  );
};
