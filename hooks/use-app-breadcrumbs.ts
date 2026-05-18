"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { client } from "@/lib/api";
import type { AppBreadcrumbItem } from "@/components/app-shell/app-breadcrumbs";

type RouteParams = {
	documentId?: string | string[];
	conversationId?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

function useDocumentTitle(documentId: string | undefined) {
	return useQuery({
		queryKey: ["document", documentId],
		queryFn: async () => {
			if (!documentId) return null;
			const { data } = await client.documents({ id: documentId }).get();
			return data?.title ?? null;
		},
		enabled: !!documentId,
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
	});
}

function useConversationTitle(conversationId: string | undefined) {
	return useQuery({
		queryKey: ["conversation", conversationId],
		queryFn: async () => {
			if (!conversationId) return null;
			const { data } = await client
				.conversations({ id: conversationId })
				.get();
			return data?.title ?? null;
		},
		enabled: !!conversationId,
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
	});
}

export function useAppBreadcrumbs() {
	const pathname = usePathname();
	const params = useParams<RouteParams>();
	const documentId = getParam(params?.documentId);
	const conversationId = getParam(params?.conversationId);

	const { data: documentTitle } = useDocumentTitle(documentId);
	const { data: conversationTitle } = useConversationTitle(conversationId);

	if (!pathname.startsWith("/documents")) {
		return [];
	}

	const items: AppBreadcrumbItem[] = [
		{ title: "Documents", href: "/documents" },
	];

	if (documentId) {
		items.push({
			title: documentTitle ?? "Document",
			href: `/documents/${documentId}`,
		});
	}

	if (conversationId) {
		items.push({
			title: conversationTitle ?? "Conversation",
		});
	}

	return items;
}