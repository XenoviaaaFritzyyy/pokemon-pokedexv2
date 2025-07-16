"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TeamSlot } from "@/components/team-slot"
import { TypeCoverage } from "@/components/type-coverage"
import { PokemonSearch } from "@/components/pokemon-search"
import { Download, Upload, Trash2, Users } from "lucide-react"

export interface TeamPokemon {
  id: string
  pokemon: any
  moves: any[]
  nature: string
  heldItem: any | null
  nickname?: string
}

export function TeamBuilder() {
  const [team, setTeam] = useState<(TeamPokemon | null)[]>(Array(6).fill(null))
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [showPokemonSearch, setShowPokemonSearch] = useState(false)

  const addPokemonToTeam = (pokemon: any, slotIndex: number) => {
    const newTeamMember: TeamPokemon = {
      id: `${pokemon.id}-${Date.now()}`,
      pokemon,
      moves: [],
      nature: "hardy",
      heldItem: null,
      nickname: "",
    }

    const newTeam = [...team]
    newTeam[slotIndex] = newTeamMember
    setTeam(newTeam)
    setShowPokemonSearch(false)
    setSelectedSlot(null)
  }

  const updateTeamMember = (slotIndex: number, updates: Partial<TeamPokemon>) => {
    const newTeam = [...team]
    if (newTeam[slotIndex]) {
      newTeam[slotIndex] = { ...newTeam[slotIndex]!, ...updates }
      setTeam(newTeam)
    }
  }

  const removePokemonFromTeam = (slotIndex: number) => {
    const newTeam = [...team]
    newTeam[slotIndex] = null
    setTeam(newTeam)
  }

  const clearTeam = () => {
    setTeam(Array(6).fill(null))
  }

  const exportTeam = () => {
    const teamData = {
      team: team.filter(Boolean),
      exportedAt: new Date().toISOString(),
    }
    const dataStr = JSON.stringify(teamData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "pokemon-team.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importTeam = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.team && Array.isArray(data.team)) {
            const importedTeam = Array(6).fill(null)
            data.team.forEach((member: TeamPokemon, index: number) => {
              if (index < 6) {
                importedTeam[index] = member
              }
            })
            setTeam(importedTeam)
          }
        } catch (error) {
          console.error("Error importing team:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  const teamPokemon = team.filter(Boolean) as TeamPokemon[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Team Builder
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Create your perfect Pokémon team</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearTeam}
            disabled={teamPokemon.length === 0}
            className="rounded-full hover:scale-105 transition-transform bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Team
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportTeam}
            disabled={teamPokemon.length === 0}
            className="rounded-full hover:scale-105 transition-transform bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Team
          </Button>

          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full hover:scale-105 transition-transform bg-transparent"
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import Team
              </span>
            </Button>
            <input type="file" accept=".json" onChange={importTeam} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Team Slots */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold flex items-center justify-center space-x-2">
                <span>Your Team</span>
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold">
                  {teamPokemon.length}/6
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {team.map((teamMember, index) => (
                  <TeamSlot
                    key={index}
                    slotIndex={index}
                    teamMember={teamMember}
                    onAddPokemon={() => {
                      setSelectedSlot(index)
                      setShowPokemonSearch(true)
                    }}
                    onUpdateMember={(updates) => updateTeamMember(index, updates)}
                    onRemovePokemon={() => removePokemonFromTeam(index)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Type Coverage */}
        <div className="xl:col-span-1">
          <TypeCoverage team={teamPokemon} />
        </div>
      </div>

      {/* Pokemon Search Modal */}
      {showPokemonSearch && selectedSlot !== null && (
        <PokemonSearch
          onSelectPokemon={(pokemon) => addPokemonToTeam(pokemon, selectedSlot)}
          onClose={() => {
            setShowPokemonSearch(false)
            setSelectedSlot(null)
          }}
        />
      )}
    </div>
  )
}
