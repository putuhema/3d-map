import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { Database, Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

interface ImportData {
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];
	exportedAt?: string;
}

interface DataManagerProps {
	onExport: () => void;
	onImport: (data: ImportData) => boolean;
	onReset: () => void;
	onClear: () => void;
	stats: {
		buildings: number;
		corridors: number;
		rooms: number;
		hasModifications: boolean;
	};
}

export function DataManager({
	onExport,
	onImport,
	onReset,
	onClear,
	stats,
}: DataManagerProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				const success = onImport(data);
				if (success) {
					alert("Data imported successfully!");
				} else {
					alert("Failed to import data. Please check the file format.");
				}
			} catch (error) {
				alert("Invalid JSON file. Please check the file format.");
			}
		};
		reader.readAsText(file);
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Database className="h-5 w-5" />
					Data Manager
				</CardTitle>
				<CardDescription>
					Manage your hospital map data with localStorage persistence
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Statistics */}
				<div className="grid grid-cols-3 gap-2 text-sm">
					<div className="text-center">
						<div className="font-semibold">{stats.buildings}</div>
						<div className="text-muted-foreground">Buildings</div>
					</div>
					<div className="text-center">
						<div className="font-semibold">{stats.corridors}</div>
						<div className="text-muted-foreground">Corridors</div>
					</div>
					<div className="text-center">
						<div className="font-semibold">{stats.rooms}</div>
						<div className="text-muted-foreground">Rooms</div>
					</div>
				</div>

				{/* Status indicator */}
				{stats.hasModifications && (
					<div className="rounded bg-amber-50 p-2 text-amber-600 text-xs">
						⚠️ Data has been modified from defaults
					</div>
				)}

				{/* Action buttons */}
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onExport}
						className="flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						Export
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						className="flex items-center gap-2"
					>
						<Upload className="h-4 w-4" />
						Import
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onReset}
						className="flex items-center gap-2"
					>
						<RotateCcw className="h-4 w-4" />
						Reset
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						className="flex items-center gap-2 text-red-600 hover:text-red-700"
					>
						<Trash2 className="h-4 w-4" />
						Clear
					</Button>
				</div>

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept=".json"
					onChange={handleImport}
					className="hidden"
				/>
			</CardContent>
		</Card>
	);
}
