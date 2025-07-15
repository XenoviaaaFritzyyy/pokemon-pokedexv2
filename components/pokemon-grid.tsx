"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface PokemonGridProps {
  pokemon: any[]
  onPokemonSelect: (pokemon: any) => void
  selectedPokemon: any
}

export function PokemonGrid({ pokemon, onPokemonSelect }: PokemonGridProps) {
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null)
  const [spriteMode, setSpriteMode] = useState<{ [key: number]: boolean }>({})

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      normal: "bg-gray-400",
      fire: "bg-red-500",
      water: "bg-blue-500",
      electric: "bg-yellow-400",
      grass: "bg-green-500",
      ice: "bg-blue-300",
      fighting: "bg-red-700",
      poison: "bg-purple-500",
      ground: "bg-yellow-600",
      flying: "bg-indigo-400",
      psychic: "bg-pink-500",
      bug: "bg-green-400",
      rock: "bg-yellow-800",
      ghost: "bg-purple-700",
      dragon: "bg-indigo-700",
      dark: "bg-gray-800",
      steel: "bg-gray-500",
      fairy: "bg-pink-300",
    }
    return colors[type] || "bg-gray-400"
  }

  const getCorrectSprite = (poke: any, isHovered: boolean, isSprite: boolean) => {
    // For regional forms, mega evolutions, and other variants, use the correct sprite
    const name = poke.name.toLowerCase()

    if (isSprite) {
      // For sprite mode, use animated sprite on hover
      if (isHovered) {
        return (
          poke.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ||
          poke.sprites.front_default ||
          "/placeholder.svg?height=80&width=80"
        )
      }
      return poke.sprites.front_default || "/placeholder.svg?height=80&width=80"
    } else {
      // For 3D mode, prioritize official artwork, but fall back to regular sprite
      return (
        poke.sprites.other["official-artwork"]?.front_default ||
        poke.sprites.front_default ||
        "/placeholder.svg?height=80&width=80"
      )
    }
  }

  const getDisplayName = (name: string) => {
    // Format names for better display
    return name
      .replace("-alola", " (Alolan)")
      .replace("-galar", " (Galarian)")
      .replace("-hisui", " (Hisuian)")
      .replace("-paldea", " (Paldean)")
      .replace("-mega-x", " (Mega X)")
      .replace("-mega-y", " (Mega Y)")
      .replace("-mega", " (Mega)")
      .replace("-gmax", " (Gigantamax)")
      .replace("-", " ")
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {pokemon.map((poke) => {
        const isHovered = hoveredPokemon === poke.id
        const isSprite = spriteMode[poke.id] || false

        return (
          <Card
            key={`${poke.id}-${poke.name}`}
            className="cursor-pointer transition-all duration-200 hover:shadow-lg"
            onClick={() => onPokemonSelect(poke)}
            onMouseEnter={() => setHoveredPokemon(poke.id)}
            onMouseLeave={() => setHoveredPokemon(null)}
            onDoubleClick={() => setSpriteMode((prev) => ({ ...prev, [poke.id]: !prev[poke.id] }))}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <Image
                    src={getCorrectSprite(poke, isHovered, isSprite) || "/placeholder.svg"}
                    alt={poke.name}
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      isHovered && !isSprite ? "scale-110" : ""
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  #{poke.id.toString().padStart(3, "0")}
                </div>
                <h3 className="font-semibold text-sm capitalize mb-2 text-gray-900 dark:text-white">
                  {getDisplayName(poke.name)}
                </h3>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {poke.types.map((type: any) => (
                    <Badge key={type.type.name} className={`${getTypeColor(type.type.name)} text-white text-xs`}>
                      {type.type.name}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {isSprite ? "Sprite Mode" : "3D Mode"} • Double-click to toggle
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
