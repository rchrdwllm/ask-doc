'use client'

import { ProgressProvider } from '@bprogress/next/app';

export default function TopLoaderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="3px"
      color="oklch(0.5 0.134 242.749)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  )
}