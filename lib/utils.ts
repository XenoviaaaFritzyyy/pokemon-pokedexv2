import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generation ranges for Pokemon
export const GENERATION_RANGES = {
  gen1: { start: 1, end: 151 },
  gen2: { start: 152, end: 251 },
  gen3: { start: 252, end: 386 },
  gen4: { start: 387, end: 493 },
  gen5: { start: 494, end: 649 },
  gen6: { start: 650, end: 721 },
  gen7: { start: 722, end: 809 },
  gen8: { start: 810, end: 905 },
  gen9: { start: 906, end: 1025 },
} as const

export type GenerationKey = keyof typeof GENERATION_RANGES

export function filterPokemonByGeneration(
  pokemon: any[],
  generation: string,
): any[] {
  if (generation === "all" || !generation) {
    return pokemon
  }

  const range = GENERATION_RANGES[generation as GenerationKey]
  if (!range) {
    return pokemon
  }

  return pokemon.filter((p) => p.id >= range.start && p.id <= range.end)
}
