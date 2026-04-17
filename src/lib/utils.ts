import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL for a file in `public/` (honors Vite `base`, e.g. GitHub Pages `/repo/`). */
export function publicAsset(file: string): string {
  const path = file.startsWith("/") ? file.slice(1) : file;
  return `${import.meta.env.BASE_URL}${path}`;
}
