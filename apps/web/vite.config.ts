import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,glb,gltf,jpeg,jpg}"],
				swDest: "dist/sw.js",
				navigateFallback: "/offline.html",
			},
			manifest: {
				name: "Hospital Map",
				short_name: "Hospital Map",
				description: "3D Hospital Map Application for navigation",
				theme_color: "#000000",
				background_color: "#ffffff",
				display: "standalone",
				orientation: "portrait-primary",
				start_url: "/",
				icons: [
					{
						src: "/icons/android-chrome-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/icons/android-chrome-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
