import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeProvider } from "@/components/theme-provider";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";

export type RouterAppContext = Record<string, never>;

type MapSearch = {
	fromId?: string | null;
	toId?: string | null;
	selector?: boolean | null;
	dialog?: string | null;
	currentId?: string | null;
	type?: "building" | "room" | "corridor" | null;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	validateSearch: (search: Record<string, unknown>): MapSearch => {
		return {
			fromId: search.fromId as string | null,
			toId: search.toId as string | null,
			selector: search.selector as boolean | null,
			dialog: search.dialog as string | null,
			currentId: search.currentId as string | null,
			type: search.type as "building" | "room" | "corridor" | null,
		};
	},
	head: () => ({
		meta: [
			{
				title: "Map | RSUD Mamuju Tengah",
			},
			{
				name: "description",
				content: "Digital Map of RSUD Mamuju Tengah",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				<Outlet />
				<PWAInstallPrompt />
				<ServiceWorkerRegistration />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-right" />
		</>
	);
}
