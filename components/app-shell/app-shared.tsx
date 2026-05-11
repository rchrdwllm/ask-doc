import type { ReactNode } from "react";
import { FileTextIcon, HelpCircleIcon, SettingsIcon } from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{
				title: "Documents",
				path: "/documents",
				icon: <FileTextIcon />,
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help",
		path: "#/help",
		icon: <HelpCircleIcon />,
	},
	{
		title: "Settings",
		path: "/dashboard/settings",
		icon: <SettingsIcon />,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];