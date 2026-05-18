"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-shell/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/app-shell/custom-sidebar-trigger";
import { NavUser } from "@/components/app-shell/nav-user";
import { useAppBreadcrumbs } from "@/hooks/use-app-breadcrumbs";

export function AppHeader() {
	const breadcrumbs = useAppBreadcrumbs();

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs items={breadcrumbs} />
			</div>
			<div className="flex items-center gap-3">
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
