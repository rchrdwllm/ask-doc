import { Fragment } from "react";
import Link from "next/link";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Breadcrumb segment shown in the header. */
export type AppBreadcrumbItem = {
	title: string;
	href?: string;
};

export function AppBreadcrumbs({
	items,
}: {
	items?: AppBreadcrumbItem[] | null;
}) {
	if (!items?.length) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					return (
						<Fragment key={`${item.title}-${index}`}>
							<BreadcrumbItem>
								{isLast || !item.href ? (
									<BreadcrumbPage>{item.title}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link href={item.href}>{item.title}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast ? <BreadcrumbSeparator /> : null}
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
