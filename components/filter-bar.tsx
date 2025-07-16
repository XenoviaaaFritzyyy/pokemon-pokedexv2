"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  typeFilter1: string
  onTypeFilter1Change: (value: string) => void
  typeFilter2: string
  onTypeFilter2Change: (value: string) => void
}

const pokemonTypes = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]

const getTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  }
  return colors[type] || "#68A090"
}

function TypeSelectItem({ type }: { type: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTypeColor(type) }} />
      <span className="capitalize">{type}</span>
    </div>
  )
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  typeFilter1,
  onTypeFilter1Change,
  typeFilter2,
  onTypeFilter2Change,
}: FilterBarProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search Pokémon by name or number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent side="bottom" position="popper">
            <SelectItem value="id">Pokédex Number</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="height">Height</SelectItem>
            <SelectItem value="weight">Weight</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter 1 */}
        <Select value={typeFilter1} onValueChange={onTypeFilter1Change}>
          <SelectTrigger>
            <SelectValue placeholder="Type 1" />
          </SelectTrigger>
          <SelectContent side="bottom" position="popper">
            <SelectItem value="all">All Types</SelectItem>
            {pokemonTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <TypeSelectItem type={type} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter 2 */}
        <Select value={typeFilter2} onValueChange={onTypeFilter2Change}>
          <SelectTrigger>
            <SelectValue placeholder="Type 2" />
          </SelectTrigger>
          <SelectContent side="bottom" position="popper">
            <SelectItem value="all">All Types</SelectItem>
            {pokemonTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <TypeSelectItem type={type} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
