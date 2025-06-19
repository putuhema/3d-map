import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DestinationSelectorProps {
	buildings: Building[];
	rooms: Room[];
	onFromSelect: (id: string, type: "building" | "room") => void;
	onToSelect: (id: string, type: "building" | "room") => void;
	onFindPath: () => void;
	onUseCurrentLocation: () => void;
	fromId: string | null;
	toId: string | null;
	playerPosition: { x: number; y: number; z: number };
	isExpanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
}

export function DestinationSelector({
	buildings,
	rooms,
	onFromSelect,
	onToSelect,
	onFindPath,
	onUseCurrentLocation,
	fromId,
	toId,
	playerPosition,
	isExpanded,
	onExpandedChange,
}: DestinationSelectorProps) {
	const [fromSearch, setFromSearch] = useState("");
	const [toSearch, setToSearch] = useState("");
	const [fromOpen, setFromOpen] = useState(false);
	const [toOpen, setToOpen] = useState(false);
	const [isExpandedState, setIsExpandedState] = useState(isExpanded || false);

	// Sync internal state with prop
	useEffect(() => {
		if (isExpanded !== undefined) {
			setIsExpandedState(isExpanded);
		}
	}, [isExpanded]);

	// Handle internal state changes and call callback
	const handleExpandedChange = (expanded: boolean) => {
		setIsExpandedState(expanded);
		if (onExpandedChange) {
			onExpandedChange(expanded);
		}
	};

	// Get all locations (buildings + rooms)
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
			.filter((room) => room.name !== "")
			.map((room) => ({
				id: room.id,
				name: room.name,
				type: "room" as const,
				displayName: `${room.name} (Room)`,
			}));

		return [...buildingLocations, ...roomLocations].sort((a, b) =>
			a.displayName.localeCompare(b.displayName),
		);
	}, [buildings, rooms]);

	// Filter locations based on search
	const filteredFromLocations = useMemo(() => {
		return allLocations.filter((location) =>
			location.name.toLowerCase().includes(fromSearch.toLowerCase()),
		);
	}, [allLocations, fromSearch]);

	const filteredToLocations = useMemo(() => {
		return allLocations.filter((location) =>
			location.name.toLowerCase().includes(toSearch.toLowerCase()),
		);
	}, [allLocations, toSearch]);

	// Get selected location names
	const getSelectedFromName = () => {
		if (fromId === "current") {
			return `Current Location (${playerPosition.x.toFixed(1)}, ${playerPosition.z.toFixed(1)})`;
		}
		const location = allLocations.find((loc) => loc.id === fromId);
		return location ? location.displayName : "Select starting point";
	};

	const getSelectedToName = () => {
		const location = allLocations.find((loc) => loc.id === toId);
		return location ? location.displayName : "Select destination";
	};

	const handleFromSelect = (id: string, type: "building" | "room") => {
		onFromSelect(id, type);
		setFromOpen(false);
		setFromSearch("");
	};

	const handleToSelect = (id: string, type: "building" | "room") => {
		onToSelect(id, type);
		setToOpen(false);
		setToSearch("");
	};

	const handleUseCurrentLocation = () => {
		onUseCurrentLocation();
		setFromOpen(false);
		setFromSearch("");
	};

	const canFindPath = fromId && toId && fromId !== toId;

	// Get summary text for collapsed state
	const getSummaryText = () => {
		if (!fromId && !toId) {
			return "Plan your route";
		}
		if (fromId && !toId) {
			return `From: ${getSelectedFromName()}`;
		}
		if (!fromId && toId) {
			return `To: ${getSelectedToName()}`;
		}
		return `${getSelectedFromName()} → ${getSelectedToName()}`;
	};

	return (
		<div className="absolute top-0 right-0 left-0 z-20 p-4">
			<AnimatePresence mode="wait">
				{!isExpandedState ? (
					<motion.div
						key="collapsed"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.2 }}
					>
						<Button
							onClick={() => handleExpandedChange(true)}
							className="justify-between border bg-background/95 shadow-lg backdrop-blur-sm"
							variant="outline"
						>
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								<span className="truncate">{getSummaryText()}</span>
							</div>
							<ChevronDown className="h-4 w-4 opacity-50" />
						</Button>
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
						className="space-y-4 overflow-hidden rounded-lg border bg-background/70 shadow-lg backdrop-blur-sm"
					>
						<div className="p-4">
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
										From
									</label>
									<Select
										value={fromId || ""}
										onValueChange={(value) =>
											handleFromSelect(value, "building")
										}
									>
										<SelectTrigger className="w-full bg-background">
											<SelectValue placeholder="Pilih Lokasi" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] overflow-y-auto">
											{filteredFromLocations.map((location) => (
												<SelectItem key={location.id} value={location.id}>
													{location.displayName}
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
										To
									</label>
									<Select
										value={toId || ""}
										onValueChange={(value) => handleToSelect(value, "building")}
									>
										<SelectTrigger className="w-full bg-background">
											<SelectValue placeholder="Pilih Lokasi" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] overflow-y-auto">
											{filteredToLocations.map((location) => (
												<SelectItem key={location.id} value={location.id}>
													{location.displayName}
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
