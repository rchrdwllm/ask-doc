"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { UserIcon, SettingsIcon, LogOutIcon, SunIcon, MoonIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

export function NavUser() {
	const { data, isPending } = authClient.useSession();
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark";

	if (isPending) {
		return <Skeleton className="size-8 rounded-full" />
	}

	if (!data) {
		return null;
	}

	const { user } = data;
	const userInitials = user.name[0] || "U";

	const handleSignOut = async () => {
		await authClient.signOut();

		router.refresh();
	}

	const handleThemeChange = (e: MouseEvent) => {
		e.preventDefault();
		setTheme(isDark ? "light" : "dark")
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="size-8 cursor-pointer">
					<AvatarImage src={user.image || undefined} />
					<AvatarFallback>{userInitials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuItem className="flex items-center justify-start gap-2">
					<DropdownMenuLabel className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage src={user.image || undefined} />
							<AvatarFallback>{userInitials}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">
								{user.name || "User"}
							</span>
							<br />
							<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{user.email}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<UserIcon />
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem>
						<SettingsIcon />
						Settings
					</DropdownMenuItem>
					<DropdownMenuItem className="flex items-center justify-between gap-4" onClick={handleThemeChange as any}>
						<div className="flex items-center gap-2">
							{isDark ? <MoonIcon /> : <SunIcon />}
							<span>{isDark ? "Dark" : "Light"}</span>
						</div>
						<Switch checked={isDark} />
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						variant="destructive"
						onClick={handleSignOut}
					>
						<LogOutIcon />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}