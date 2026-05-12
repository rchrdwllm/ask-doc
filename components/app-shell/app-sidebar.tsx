"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogoIcon } from "@/components/app-shell/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/app-shell/nav-group";
import { footerNavLinks, navGroups } from "@/components/app-shell/app-shared";
import { FileTextIcon, UploadIcon } from "lucide-react";
import { UploadDialog } from "@/components/documents/upload-dialog";
import Link from "next/link";
import { client } from "@/lib/api";
import type { DocumentRow } from "@/db/schema";

export function AppSidebar() {
	const [isOpen, setIsOpen] = useState(false);
	const [recentDocuments, setRecentDocuments] = useState<DocumentRow[]>([]);
	const [isLoadingRecents, setIsLoadingRecents] = useState(true);
	const [recentAccesses, setRecentAccesses] = useState<
		Record<string, { id: string; title: string; accessedAt: string }>
	>({});

	const loadRecentDocuments = useCallback(async () => {
		setIsLoadingRecents(true);
		const { data } = await client.documents.get();
		setRecentDocuments(data ?? []);
		setIsLoadingRecents(false);
	}, []);

	useEffect(() => {
		loadRecentDocuments();
	}, [loadRecentDocuments]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem("askdoc:recent-documents");
		if (!stored) return;
		try {
			const parsed = JSON.parse(stored) as Array<{
				id?: string;
				title?: string;
				accessedAt?: string;
			}>;
			if (!Array.isArray(parsed)) return;
			const entries = parsed
				.filter((entry) => entry.id && entry.title && entry.accessedAt)
				.map((entry) => ({
					id: entry.id as string,
					title: entry.title as string,
					accessedAt: entry.accessedAt as string,
				}));
			const next = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
			setRecentAccesses(next);
		} catch {
			return;
		}
	}, []);

	const updateRecentAccess = useCallback((doc: DocumentRow) => {
		if (typeof window === "undefined") return;
		const accessedAt = new Date().toISOString();
		setRecentAccesses((prev) => {
			const next = {
				...prev,
				[doc.id]: {
					id: doc.id,
					title: doc.title,
					accessedAt,
				},
			};
			const ordered = Object.values(next)
				.sort(
					(a, b) =>
						new Date(b.accessedAt).getTime() -
						new Date(a.accessedAt).getTime(),
				)
				.slice(0, 20);
			const trimmed = Object.fromEntries(
				ordered.map((entry) => [entry.id, entry]),
			);
			window.localStorage.setItem(
				"askdoc:recent-documents",
				JSON.stringify(ordered),
			);
			return trimmed;
		});
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleDocumentsUpdated = () => {
			loadRecentDocuments();
		};

		window.addEventListener("askdoc:documents-updated", handleDocumentsUpdated);

		return () => {
			window.removeEventListener(
				"askdoc:documents-updated",
				handleDocumentsUpdated,
			);
		};
	}, [loadRecentDocuments]);

	const recentItems = useMemo(() => {
		return [...recentDocuments]
			.map((doc) => {
				const access = recentAccesses[doc.id];
				const accessedAt = access?.accessedAt
					? new Date(access.accessedAt).getTime()
					: 0;
				const updatedAt = new Date(doc.updatedAt ?? doc.createdAt).getTime();
				return {
					doc,
					sortTime: Math.max(accessedAt, updatedAt),
				};
			})
			.sort((a, b) => b.sortTime - a.sortTime)
			.slice(0, 5);
	}, [recentDocuments, recentAccesses]);

	return (
		<>
			<Sidebar collapsible="icon" variant="inset">
				<SidebarHeader className="h-14 justify-center">
					<SidebarMenuButton asChild>
						<Link href="/documents">
							<LogoIcon className="size-6" />
							<span className="font-medium">AskDoc</span>
						</Link>
					</SidebarMenuButton>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarMenuItem className="flex items-center gap-2">
							<SidebarMenuButton
								className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
								tooltip="Upload Document"
								onClick={() => setIsOpen(true)}
							>
								<UploadIcon />
								<span>Upload Document</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarGroup>
					{navGroups.map((group, index) => (
						<NavGroup key={`sidebar-group-${index}`} {...group} />
					))}
					<SidebarGroup>
						<SidebarGroupLabel>Recents</SidebarGroupLabel>
						<SidebarMenu className="mt-1">
							{isLoadingRecents
								? Array.from({ length: 3 }).map((_, index) => (
									<SidebarMenuItem key={`recent-loading-${index}`}>
										<div className="h-8 animate-pulse rounded-md bg-sidebar-accent/40" />
									</SidebarMenuItem>
								))
								: recentItems.length > 0
									? recentItems.map(({ doc }) => (
										<SidebarMenuItem key={doc.id}>
											<SidebarMenuButton
												asChild
												tooltip={doc.title}
												onClick={() => updateRecentAccess(doc)}
											>
												<Link href={`/documents#document-${doc.id}`}>
													<FileTextIcon />
													<span>{doc.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))
									: (
										<SidebarMenuItem>
											<SidebarMenuButton disabled>
												<span>No recent documents</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
							}
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<SidebarMenu className="mt-2">
						{footerNavLinks.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									className="text-muted-foreground"
									isActive={item.isActive}
									size="sm"
								>
									<Link href={item.path || "#"}>
										{item.icon}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<UploadDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
