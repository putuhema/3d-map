interface DirectionsDisplayProps {
	directions: string[];
	onClear: () => void;
}

export function DirectionsDisplay({
	directions,
	onClear,
}: DirectionsDisplayProps) {
	if (directions.length === 0) return null;

	return (
		<div className="absolute bottom-6 left-6 z-20 rounded bg-white/90 p-4 shadow">
			<h3 className="mb-2 font-bold">Directions</h3>
			<ol className="ml-4 list-decimal">
				{directions.map((step) => (
					<li key={step}>{step}</li>
				))}
			</ol>
			<button
				className="mt-2 rounded bg-gray-200 px-3 py-1"
				onClick={onClear}
				type="button"
			>
				Clear Selection
			</button>
		</div>
	);
}
