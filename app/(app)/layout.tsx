import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShell>
        {children}
      </AppShell>
    </Suspense>
  );
}