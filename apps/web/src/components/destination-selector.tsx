import { Button } from "@/components/ui/button";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useHospitalMapStore } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface Location {
	id: string;
	name: string;
	type: "building" | "room" | "corridor";
	displayName: string;
}

export function DestinationSelector() {
	const [search, setSearch] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const { buildings, rooms, handleReset } = useHospitalMapStore();
	const { handleFindPath } = useHospitalMap();
	const { fromId, toId, selector, type } = useSearch({ strict: false });
	const navigate = useNavigate({ from: "/" });

	// Reset search when selector closes
	useEffect(() => {
		if (!selector) {
			setSearch("");
			setHighlightedIndex(0);
		}
	}, [selector]);

	// Reset search when location is selected
	useEffect(() => {
		if (fromId || toId) {
			setSearch("");
			setHighlightedIndex(0);
		}
	}, [fromId, toId]);

	// Reset highlighted index when search changes
	useEffect(() => {
		setHighlightedIndex(0);
	}, [search]);

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
				name: "Check Point 2",
				type: "corridor" as const,
				displayName: "Check Point 2 (Corridor)",
			},
		].sort((a, b) => a.displayName.localeCompare(b.displayName));
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
		setSearch("");
		setHighlightedIndex(0);
		navigate({ search: {} });
	};

	const onFindPath = () => {
		if (canFindPath) {
			handleFindPath();
		}
	};

	const filterLocations = useCallback(
		(searchTerm: string) => {
			if (!searchTerm.trim()) return allLocations;

			const filtered = allLocations.filter((location) => {
				const matchesSearch =
					location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					location.displayName.toLowerCase().includes(searchTerm.toLowerCase());

				// Don't show already selected locations
				const notFrom = !fromId || location.id !== fromId;
				const notTo = !toId || location.id !== toId;

				return matchesSearch && notFrom && notTo;
			});

			return filtered.slice(0, 10); // Limit results for better UX
		},
		[allLocations, fromId, toId],
	);

	const handleLocationSelect = useCallback(
		(location: Location) => {
			if (!fromId) {
				// Select from location
				navigate({
					search: {
						fromId: location.id,
						toId,
						selector: true,
					},
				});
			} else if (!toId) {
				// Select to location
				navigate({
					search: {
						fromId,
						toId: location.id,
						selector: true,
					},
				});
			}
		},
		[fromId, toId, navigate],
	);

	const searchResults = useMemo(
		() => filterLocations(search),
		[filterLocations, search],
	);

	const getInputPlaceholder = () => {
		if (!fromId) return "Cari lokasi asal...";
		if (!toId) return "Cari lokasi tujuan...";
		return "Lokasi sudah dipilih";
	};

	const isInputDisabled = () => {
		return Boolean(fromId && toId);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (isInputDisabled()) return;

		if (e.key === "Enter" && searchResults.length > 0) {
			e.preventDefault();
			const selectedLocation = searchResults[highlightedIndex];
			if (selectedLocation) {
				handleLocationSelect(selectedLocation);
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev < searchResults.length - 1 ? prev + 1 : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev > 0 ? prev - 1 : searchResults.length - 1,
			);
		} else if (e.key === "Escape") {
			setSearch("");
			setHighlightedIndex(0);
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
								{/* Single Search Input */}
								<div className="space-y-2">
									<label
										htmlFor="location-input"
										className="flex items-center gap-2 font-medium text-foreground text-sm"
									>
										<MapPin className="h-4 w-4" />
										{!fromId ? "Dari" : !toId ? "Ke" : "Lokasi"}
									</label>
									<div className="relative">
										<Input
											id="location-input"
											placeholder={getInputPlaceholder()}
											value={search}
											disabled={isInputDisabled()}
											onChange={(e) => {
												setSearch(e.target.value);
											}}
											onKeyDown={handleKeyDown}
											className="pr-8"
										/>
										<Search className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
									</div>

									{/* Search Results */}
									<AnimatePresence>
										{search && !isInputDisabled() && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="relative py-4"
											>
												<ScrollArea className="max-h-[200px] w-full rounded-md border bg-background">
													{searchResults.length > 0 ? (
														searchResults.map((location, index) => (
															<Button
																key={location.id}
																variant={
																	index === highlightedIndex
																		? "secondary"
																		: "ghost"
																}
																className={`w-full justify-start rounded-none border-b last:border-b-0 ${
																	index === highlightedIndex
																		? "bg-secondary text-secondary-foreground"
																		: ""
																}`}
																onClick={() => handleLocationSelect(location)}
																onMouseEnter={() => setHighlightedIndex(index)}
															>
																<div className="flex flex-col items-start">
																	<span className="font-medium">
																		{location.name}
																	</span>
																	<span className="text-muted-foreground text-xs">
																		{location.type}
																	</span>
																</div>
															</Button>
														))
													) : (
														<div className="p-4 text-center text-muted-foreground text-sm">
															Tidak ada lokasi ditemukan
														</div>
													)}
												</ScrollArea>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Selected Locations Display */}
								<div className="space-y-2">
									{fromId && (
										<div className="flex items-center gap-2 rounded-md bg-muted p-2">
											<MapPin className="h-4 w-4 text-primary" />
											<span className="font-medium text-sm">
												Dari: {getSelectedName(fromId)}
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													navigate({
														search: { fromId: undefined, toId, selector: true },
													})
												}
												className="ml-auto h-6 w-6 p-0"
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									)}

									{toId && (
										<div className="flex items-center gap-2 rounded-md bg-muted p-2">
											<MapPin className="h-4 w-4 text-primary" />
											<span className="font-medium text-sm">
												Ke: {getSelectedName(toId)}
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													navigate({
														search: { fromId, toId: undefined, selector: true },
													})
												}
												className="ml-auto h-6 w-6 p-0"
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3, duration: 0.3 }}
									className="flex gap-2 pt-2"
								>
									<Button
										onClick={onFindPath}
										disabled={!canFindPath}
										className="flex-1"
									>
										Cari Rute
									</Button>
									<Button
										variant="outline"
										onClick={onReset}
										className="flex-1"
									>
										Reset
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
