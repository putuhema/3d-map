import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);

	useEffect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowInstallPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handler);

		return () => {
			window.removeEventListener("beforeinstallprompt", handler);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setShowInstallPrompt(false);
		}
		setDeferredPrompt(null);
	};

	const handleDismiss = () => {
		setShowInstallPrompt(false);
		setDeferredPrompt(null);
	};

	if (!showInstallPrompt) return null;

	return (
		<div className="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
			<Card className="shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">Install Hospital Map</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDismiss}
							className="h-6 w-6 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<CardDescription>
						Install this app on your device for quick and easy access
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="flex gap-2">
						<Button onClick={handleInstallClick} className="flex-1">
							Install
						</Button>
						<Button variant="outline" onClick={handleDismiss}>
							Not now
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
