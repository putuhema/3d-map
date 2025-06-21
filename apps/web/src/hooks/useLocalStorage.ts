import { useCallback } from "react";

interface UseLocalStorageOptions {
	serializer?: <T>(value: T) => string;
	deserializer?: <T>(value: string) => T;
}

export function useLocalStorage(options: UseLocalStorageOptions = {}) {
	const { serializer = JSON.stringify, deserializer = JSON.parse } = options;

	const getItem = useCallback(
		<T>(key: string): T | null => {
			try {
				const item = localStorage.getItem(key);
				return item ? deserializer(item) : null;
			} catch (error) {
				console.warn(`Error reading localStorage key "${key}":`, error);
				return null;
			}
		},
		[deserializer],
	);

	const setItem = useCallback(
		<T>(key: string, value: T) => {
			try {
				localStorage.setItem(key, serializer(value));
			} catch (error) {
				console.warn(`Error setting localStorage key "${key}":`, error);
			}
		},
		[serializer],
	);

	const removeItem = useCallback((key: string) => {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.warn(`Error removing localStorage key "${key}":`, error);
		}
	}, []);

	const clear = useCallback(() => {
		try {
			localStorage.clear();
		} catch (error) {
			console.warn("Error clearing localStorage:", error);
		}
	}, []);

	return {
		getItem,
		setItem,
		removeItem,
		clear,
	};
}
