import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, X } from "lucide-react";
import { useCallback, useMemo } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useHospitalMapStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";

export function DestinationSelector() {
	const { buildings, rooms, handleReset } = useHospitalMapStore();
	const { handleFindPath } = useHospitalMap();
	const { fromId, toId, selector, type } = useSearch({ from: Route.fullPath });
	const navigate = useNavigate({ from: Route.fullPath });

	const handleExpandedChange = (expanded: boolean) => {
		navigate({
			search: { selector: expanded, fromId, toId, type },
		});
	};

	const allLocations = useMemo(() => {
		const buildingLocations = buildings
			.filter((building) => building.name !== "")
			.map((building) => ({
				id: building.id,
				name: building.name,
				type: "building" as const,
				displayName: `${building.name} (Building)`,
			}));

		const roomLocations = rooms
			.filter((room) => room.name !== "" && room.name !== "Wall")
			.map((room) => ({
				id: room.id,
				name: room.name,
				type: "room" as const,
				displayName: `${room.name} (Room)`,
			}));

		return [
			...buildingLocations,
			...roomLocations,
			{
				id: "8d504f48-9d86-44d0-86be-3c1fd125dece",
				name: "Pos Satpam",
				type: "corridor" as const,
				displayName: "Post Satpam (Corridor)",
			},
			{
				id: "cdcaa148-eaa3-4031-94de-5c1aaa800b03",
				name: "Check Point 1",
				type: "corridor" as const,
				displayName: "Check Point 1 (Corridor)",
			},
			{
				id: "bc3af950-429f-4434-b866-f60f897f82ee",
				name: "Check Point 2", // Close with Kaber
				type: "corridor" as const,
				displayName: "Check Point 2 (Corridor)",
			},
		].sort((a, b) => a.displayName.localeCompare(b.name));
	}, [buildings, rooms]);

	const getSelectedName = useCallback(
		(id: string | null | undefined) => {
			if (!id) return "Pilih lokasi";
			const location = allLocations.find((loc) => loc.id === id);
			return location ? location.name : "Pilih lokasi";
		},
		[allLocations],
	);

	const canFindPath = useMemo(
		() => fromId && toId && fromId !== toId,
		[fromId, toId],
	);

	const getSummaryText = () => {
		if (!fromId && !toId) {
			return "Pilih lokasi";
		}
		if (fromId && !toId) {
			return `Dari: ${getSelectedName(fromId)}`;
		}
		if (!fromId && toId) {
			return `Ke: ${getSelectedName(toId)}`;
		}

		return `${getSelectedName(fromId)} → ${getSelectedName(toId)}`;
	};

	const onReset = () => {
		handleReset();
		navigate({ search: {} });
	};

	const onFindPath = () => {
		if (canFindPath) {
			handleFindPath();
		}
	};

	return (
		<div className="absolute top-0 right-0 left-0 z-20 p-4">
			<AnimatePresence mode="popLayout">
				{!selector ? (
					<motion.div
						key="collapsed"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.2 }}
						className="mx-auto w-sm space-y-2 md:w-xl"
					>
						<Button
							onClick={() => handleExpandedChange(true)}
							className="h-12 w-full justify-between border bg-background/95 shadow-lg backdrop-blur-sm"
							variant="outline"
						>
							<div className="flex min-w-0 flex-1 items-center gap-2">
								<MapPin className="h-4 w-4 flex-shrink-0" />
								<span className="truncate">{getSummaryText()}</span>
							</div>
							<ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
						</Button>
						{fromId && toId && !selector && (
							<Button onClick={onReset}>Hapus Rute</Button>
						)}
					</motion.div>
				) : (
					<motion.div
						key="expanded"
						initial={{ opacity: 0, height: 0, scale: 0.8 }}
						animate={{ opacity: 1, height: "auto", scale: 1 }}
						exit={{ opacity: 0, height: 0, scale: 0.8 }}
						transition={{
							duration: 0.3,
							ease: "easeInOut",
							height: { duration: 0.3 },
							opacity: { duration: 0.2 },
						}}
						className="mx-auto w-sm space-y-4 overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm md:w-xl"
					>
						<div className="w-full p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-foreground">Pilih Tujuan</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleExpandedChange(false)}
									className="h-8 w-8 p-0"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1, duration: 0.3 }}
								className="space-y-4"
							>
								<div className="flex gap-2">
									<label
										htmlFor="from-select"
										className="flex w-20 items-center gap-2 font-medium text-foreground text-sm"
									>
										<MapPin className="h-4 w-4" />
										Dari
									</label>
									<Select
										value={`${fromId},${type}` || ""}
										onValueChange={(value) => {
											const [id, type] = value.split(",");
											navigate({
												search: {
													fromId: id,
													toId,
													selector,
													type: type as "building" | "room",
												},
											});
										}}
									>
										<SelectTrigger className="w-full bg-background">
											<SelectValue placeholder="Pilih Lokasi" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] overflow-y-auto">
											{allLocations.map((location) => (
												<SelectItem
													key={location.id}
													value={`${location.id},${location.type}`}
												>
													{location.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2, duration: 0.3 }}
									className="flex gap-2"
								>
									<label
										htmlFor="to-select"
										className="flex w-20 items-center gap-2 font-medium text-foreground text-sm"
									>
										<MapPin className="h-4 w-4" />
										Ke
									</label>
									<Select
										value={`${toId},${type}` || ""}
										onValueChange={(value) => {
											const [id, type] = value.split(",");
											navigate({
												search: {
													fromId,
													toId: id,
													type: type as "building" | "room",
												},
											});
										}}
									>
										<SelectTrigger
											disabled={!fromId}
											className="w-full bg-background"
										>
											<SelectValue placeholder="Pilih Lokasi" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] overflow-y-auto">
											{allLocations.map((location) => (
												<SelectItem
													key={location.id}
													value={`${location.id},${location.type}`}
												>
													{location.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3, duration: 0.3 }}
								>
									<Button
										onClick={onFindPath}
										disabled={!canFindPath}
										className="w-full"
									>
										Cari Rute
									</Button>
								</motion.div>
							</motion.div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
