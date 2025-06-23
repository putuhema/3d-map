import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function ServiceWorkerRegistration() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
		null,
	);
	const [showReload, setShowReload] = useState(false);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					registration.addEventListener("updatefound", () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener("statechange", () => {
								if (
									newWorker.state === "installed" &&
									navigator.serviceWorker.controller
								) {
									setWaitingWorker(registration.waiting);
									setShowReload(true);
								}
							});
						}
					});

					let refreshing = false;
					navigator.serviceWorker.addEventListener("controllerchange", () => {
						if (!refreshing) {
							refreshing = true;
							window.location.reload();
						}
					});
				})
				.catch((error) => {
					console.error("Service worker registration failed:", error);
				});
		}
	}, []);

	const reloadPage = () => {
		setShowReload(false);
		if (waitingWorker) {
			waitingWorker.postMessage({ type: "SKIP_WAITING" });
		}
	};

	if (!showReload) return null;

	return (
		<div className="fixed top-4 right-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
			<Card className="border-blue-200 bg-blue-50 shadow-lg">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<RefreshCw className="h-5 w-5" />
						Update Available
					</CardTitle>
					<CardDescription>
						A new version of the app is available. Reload to get the latest
						features.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<Button onClick={reloadPage} className="w-full">
						Reload Now
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
