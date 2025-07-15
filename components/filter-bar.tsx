"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  typeFilter1: string
  onTypeFilter1Change: (type: string) => void
  typeFilter2: string
  onTypeFilter2Change: (type: string) => void
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
  const pokemonTypes = [
    { id: "all", label: "All Types", color: "bg-gray-400" },
    { id: "normal", label: "Normal", color: "bg-gray-400" },
    { id: "fire", label: "Fire", color: "bg-red-500" },
    { id: "water", label: "Water", color: "bg-blue-500" },
    { id: "electric", label: "Electric", color: "bg-yellow-400" },
    { id: "grass", label: "Grass", color: "bg-green-500" },
    { id: "ice", label: "Ice", color: "bg-blue-300" },
    { id: "fighting", label: "Fighting", color: "bg-red-700" },
    { id: "poison", label: "Poison", color: "bg-purple-500" },
    { id: "ground", label: "Ground", color: "bg-yellow-600" },
    { id: "flying", label: "Flying", color: "bg-indigo-400" },
    { id: "psychic", label: "Psychic", color: "bg-pink-500" },
    { id: "bug", label: "Bug", color: "bg-green-400" },
    { id: "rock", label: "Rock", color: "bg-yellow-800" },
    { id: "ghost", label: "Ghost", color: "bg-purple-700" },
    { id: "dragon", label: "Dragon", color: "bg-indigo-700" },
    { id: "dark", label: "Dark", color: "bg-gray-800" },
    { id: "steel", label: "Steel", color: "bg-gray-500" },
    { id: "fairy", label: "Fairy", color: "bg-pink-300" },
  ]

  const TypeSelectItem = ({ type }: { type: any }) => (
    <SelectItem value={type.id} className="flex items-center">
      <div className="flex items-center space-x-2">
        {type.id !== "all" && <div className={`w-3 h-3 rounded-full ${type.color}`} />}
        <span>{type.label}</span>
      </div>
    </SelectItem>
  )

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search Pokémon by name or number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent side="bottom" align="start" position="popper">
            <SelectItem value="id">Pokédex Number</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="height">Height</SelectItem>
            <SelectItem value="weight">Weight</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Select value={typeFilter1} onValueChange={onTypeFilter1Change}>
            <SelectTrigger>
              <SelectValue placeholder="Type 1">
                {typeFilter1 === "all" ? "Type 1" : pokemonTypes.find((t) => t.id === typeFilter1)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" position="popper">
              {pokemonTypes.map((type) => (
                <TypeSelectItem key={type.id} type={type} />
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter2} onValueChange={onTypeFilter2Change}>
            <SelectTrigger>
              <SelectValue placeholder="Type 2">
                {typeFilter2 === "all" ? "Type 2" : pokemonTypes.find((t) => t.id === typeFilter2)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" position="popper">
              {pokemonTypes.map((type) => (
                <TypeSelectItem key={type.id} type={type} />
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}
