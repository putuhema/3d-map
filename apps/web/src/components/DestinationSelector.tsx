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
import { useMemo, useState } from "react";

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
}: DestinationSelectorProps) {
	const [fromSearch, setFromSearch] = useState("");
	const [toSearch, setToSearch] = useState("");
	const [fromOpen, setFromOpen] = useState(false);
	const [toOpen, setToOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// Get all locations (buildings + rooms)
	const allLocations = useMemo(() => {
		const buildingLocations = buildings.map((building) => ({
			id: building.id,
			name: building.name,
			type: "building" as const,
			displayName: `${building.name} (Building)`,
		}));

		const roomLocations = rooms.map((room) => ({
			id: room.id,
			name: room.name,
			type: "room" as const,
			displayName: `${room.name} (Room)`,
		}));

		return [...buildingLocations, ...roomLocations];
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
				{!isExpanded ? (
					<motion.div
						key="collapsed"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.2 }}
					>
						<Button
							onClick={() => setIsExpanded(true)}
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
						className="space-y-4 overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm"
					>
						<div className="p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-foreground">Route Planner</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsExpanded(false)}
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
								<div className="space-y-2">
									<label
										htmlFor="from-select"
										className="flex items-center gap-2 font-medium text-foreground text-sm"
									>
										<MapPin className="h-4 w-4" />
										From
									</label>
									<DropdownMenu open={fromOpen} onOpenChange={setFromOpen}>
										<DropdownMenuTrigger asChild>
											<Button
												id="from-select"
												variant="outline"
												className="w-full justify-between text-left font-normal"
											>
												<span className="truncate">
													{getSelectedFromName()}
												</span>
												<ChevronDown className="h-4 w-4 opacity-50" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-full min-w-[300px]"
											align="start"
										>
											<div className="p-2">
												<div className="relative">
													<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
													<Input
														placeholder="Search locations..."
														value={fromSearch}
														onChange={(e) => setFromSearch(e.target.value)}
														className="pl-8"
													/>
												</div>
											</div>
											<div className="max-h-[200px] overflow-y-auto">
												<DropdownMenuItem
													onClick={handleUseCurrentLocation}
													className="cursor-pointer font-medium text-primary"
												>
													📍 Use Current Location
												</DropdownMenuItem>
												{filteredFromLocations.length === 0 ? (
													<div className="px-2 py-1.5 text-muted-foreground text-sm">
														No locations found
													</div>
												) : (
													filteredFromLocations.map((location) => (
														<DropdownMenuItem
															key={location.id}
															onClick={() =>
																handleFromSelect(location.id, location.type)
															}
															className="cursor-pointer"
														>
															{location.displayName}
														</DropdownMenuItem>
													))
												)}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2, duration: 0.3 }}
									className="space-y-2"
								>
									<label
										htmlFor="to-select"
										className="flex items-center gap-2 font-medium text-foreground text-sm"
									>
										<MapPin className="h-4 w-4" />
										To
									</label>
									<DropdownMenu open={toOpen} onOpenChange={setToOpen}>
										<DropdownMenuTrigger asChild>
											<Button
												id="to-select"
												variant="outline"
												className="w-full justify-between text-left font-normal"
											>
												<span className="truncate">{getSelectedToName()}</span>
												<ChevronDown className="h-4 w-4 opacity-50" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-full min-w-[300px]"
											align="start"
										>
											<div className="p-2">
												<div className="relative">
													<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
													<Input
														placeholder="Search locations..."
														value={toSearch}
														onChange={(e) => setToSearch(e.target.value)}
														className="pl-8"
													/>
												</div>
											</div>
											<div className="max-h-[200px] overflow-y-auto">
												{filteredToLocations.length === 0 ? (
													<div className="px-2 py-1.5 text-muted-foreground text-sm">
														No locations found
													</div>
												) : (
													filteredToLocations.map((location) => (
														<DropdownMenuItem
															key={location.id}
															onClick={() =>
																handleToSelect(location.id, location.type)
															}
															className="cursor-pointer"
														>
															{location.displayName}
														</DropdownMenuItem>
													))
												)}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
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
										Find Path
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
