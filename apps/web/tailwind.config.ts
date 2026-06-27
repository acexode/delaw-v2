import type { Config } from "tailwindcss";
import delawPreset from "@delaw/config/tailwind/preset";

const config: Config = {
  presets: [delawPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
