import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Component } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Type utilities for component props
export type WithElementRef<T> = T & { ref?: HTMLElement | null };
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithAsChild<T> = T & {
	asChild?: boolean;
	children?: Component;
};
