"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NavigationProps {
  currentCategory: string
  onCategoryChange: (category: string) => void
  currentGeneration: string
  onGenerationChange: (generation: string) => void
}

export function Navigation({
  currentCategory,
  onCategoryChange,
  currentGeneration,
  onGenerationChange,
}: NavigationProps) {
  const categories = [
    { id: "national", label: "National Dex", shortLabel: "National" },
    { id: "regional", label: "Regional Forms", shortLabel: "Regional" },
    { id: "mega", label: "Mega Evolution", shortLabel: "Mega" },
    { id: "gmax", label: "Gigantamax", shortLabel: "Gigantamax" },
    { id: "team-builder", label: "Team Builder", shortLabel: "Team" },
  ]

  const generations = [
    { id: "all", label: "All Generations" },
    { id: "gen1", label: "Generation I" },
    { id: "gen2", label: "Generation II" },
    { id: "gen3", label: "Generation III" },
    { id: "gen4", label: "Generation IV" },
    { id: "gen5", label: "Generation V" },
    { id: "gen6", label: "Generation VI" },
    { id: "gen7", label: "Generation VII" },
    { id: "gen8", label: "Generation VIII" },
    { id: "gen9", label: "Generation IX" },
  ]

  return (
    <div className="mb-6 space-y-4">
      {/* Category Navigation */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={currentCategory === category.id ? "default" : "outline"}
            onClick={() => onCategoryChange(category.id)}
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 h-auto"
          >
            <span className="sm:hidden">{category.shortLabel}</span>
            <span className="hidden sm:inline">{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Generation Filter - Only show for National Dex */}
      {currentCategory === "national" && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Generation:</span>
          <Select value={currentGeneration} onValueChange={onGenerationChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper">
              {generations.map((gen) => (
                <SelectItem key={gen.id} value={gen.id}>
                  {gen.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
