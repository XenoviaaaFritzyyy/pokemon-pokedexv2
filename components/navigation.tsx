"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    { id: "national", label: "National Dex", icon: "🏆", shortLabel: "National" },
    { id: "regional", label: "Regional Forms", icon: "🌍", shortLabel: "Regional" },
    { id: "mega", label: "Mega Evolution", icon: "⚡", shortLabel: "Mega" },
    { id: "gmax", label: "Gigantamax", icon: "🔥", shortLabel: "G-Max" },
  ]

  const generations = [
    { id: "all", label: "All Generations", shortLabel: "All" },
    { id: "gen1", label: "Gen 1 (Kanto)", shortLabel: "Gen 1" },
    { id: "gen2", label: "Gen 2 (Johto)", shortLabel: "Gen 2" },
    { id: "gen3", label: "Gen 3 (Hoenn)", shortLabel: "Gen 3" },
    { id: "gen4", label: "Gen 4 (Sinnoh)", shortLabel: "Gen 4" },
    { id: "gen5", label: "Gen 5 (Unova)", shortLabel: "Gen 5" },
    { id: "gen6", label: "Gen 6 (Kalos)", shortLabel: "Gen 6" },
    { id: "gen7", label: "Gen 7 (Alola)", shortLabel: "Gen 7" },
    { id: "gen8", label: "Gen 8 (Galar)", shortLabel: "Gen 8" },
    { id: "gen9", label: "Gen 9 (Paldea)", shortLabel: "Gen 9" },
  ]

  return (
    <Card className="p-3 sm:p-4 mb-6">
      <div className="space-y-3 sm:space-y-4">
        {/* Category Buttons - 2x2 grid on mobile, horizontal on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={currentCategory === category.id ? "default" : "outline"}
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              <span className="text-sm sm:text-base">{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.shortLabel}</span>
            </Button>
          ))}
        </div>

        {/* Generation Filter - Only visible for National Dex */}
        {currentCategory === "national" && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generation:</span>
            <Select value={currentGeneration} onValueChange={onGenerationChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select generation...">
                  <span className="sm:hidden">
                    {generations.find((gen) => gen.id === currentGeneration)?.shortLabel}
                  </span>
                  <span className="hidden sm:inline">
                    {generations.find((gen) => gen.id === currentGeneration)?.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {generations.map((gen) => (
                  <SelectItem key={gen.id} value={gen.id}>
                    <span className="sm:hidden">{gen.shortLabel}</span>
                    <span className="hidden sm:inline">{gen.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  )
}
