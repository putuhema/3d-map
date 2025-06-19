import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutorialStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
	HelpCircle,
	Monitor,
	Mouse,
	Move,
	Smartphone,
	X,
	ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";

const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export function TutorialOverlay() {
	const { showTutorial, hasSeenTutorial, setShowTutorial, dismissTutorial } =
		useTutorialStore();
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Show tutorial on first visit
	useEffect(() => {
		if (!hasSeenTutorial) {
			// Delay showing tutorial to let the app load
			const timer = setTimeout(() => {
				setShowTutorial(true);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [hasSeenTutorial, setShowTutorial]);

	if (!showTutorial) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.8, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="mx-4 w-full max-w-md"
				>
					<Card className="relative border-2 bg-background/95 p-6 backdrop-blur-sm">
						<Button
							variant="ghost"
							size="sm"
							onClick={dismissTutorial}
							className="absolute top-2 right-2 h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>

						<div className="mb-4 flex items-center gap-2">
							<HelpCircle className="h-5 w-5 text-primary" />
							<h2 className="font-semibold text-lg">
								Selamat Datang di Peta RSUD Mamuju Tengah
							</h2>
						</div>

						<div className="space-y-4 text-sm">
							<div className="space-y-3">
								<h3 className="font-medium text-foreground">
									Cara Menavigasi:
								</h3>

								{isMobileDevice ? (
									<>
										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Geser (Pindah)</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Sentuh dengan dua jari + geser
													</span>{" "}
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<ZoomIn className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Perbesar/Perkecil</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Cubit dengan dua jari
													</span>{" "}
													untuk zoom in/out
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<Move className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Rotasi</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Sentuh dengan satu jari + putar
													</span>
												</p>
											</div>
										</div>
									</>
								) : (
									<>
										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<Monitor className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Geser (Pindah)</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Klik Kanan + seret
													</span>{" "}
													mouse
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<ZoomIn className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Perbesar/Perkecil</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Scroll wheel
													</span>{" "}
													mouse
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
											<Mouse className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
											<div>
												<p className="font-medium">Rotasi</p>
												<p className="text-muted-foreground">
													<span className="rounded bg-background px-1 font-mono">
														Klik Kiri + seret
													</span>{" "}
													mouse
												</p>
											</div>
										</div>
									</>
								)}
							</div>

							<div className="border-t pt-2">
								<p className="text-muted-foreground text-xs">
									💡 <strong>Tips:</strong> Gunakan pemilih tujuan di bagian
									atas untuk mencari rute antar gedung dan ruangan.
								</p>
							</div>
						</div>

						<div className="mt-6 flex gap-2">
							<Button onClick={dismissTutorial} className="flex-1">
								Mengerti!
							</Button>
							<Button
								variant="outline"
								onClick={() => setShowTutorial(false)}
								className="flex-1"
							>
								Tampilkan nanti
							</Button>
						</div>
					</Card>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
