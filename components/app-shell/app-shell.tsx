import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="overflow-hidden">
			<SidebarProvider className="relative h-svh">
				<AppSidebar />
				<SidebarInset className="md:peer-data-[variant=inset]:ml-0">
					<AppHeader />
					<div className="overflow-y-auto flex-1 flex flex-col">
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
