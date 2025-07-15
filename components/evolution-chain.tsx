"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Zap } from "lucide-react"
import Image from "next/image"

interface EvolutionChainProps {
  pokemon: any
  onPokemonSelect: (pokemon: any) => void
}

interface EvolutionStage {
  id: number
  name: string
  sprite: string
  types: any[]
  evolutionDetails?: any
}

export function EvolutionChain({ pokemon, onPokemonSelect }: EvolutionChainProps) {
  const [evolutionChain, setEvolutionChain] = useState<EvolutionStage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pokemon?.species?.evolution_chain?.url) {
      fetchEvolutionChain()
    }
  }, [pokemon])

  const fetchEvolutionChain = async () => {
    setLoading(true)
    try {
      const evolutionResponse = await fetch(pokemon.species.evolution_chain.url)
      if (!evolutionResponse.ok) {
        throw new Error(`HTTP error! status: ${evolutionResponse.status}`)
      }
      const evolutionData = await evolutionResponse.json()

      const chain = await parseEvolutionChain(evolutionData.chain)
      setEvolutionChain(chain)
    } catch (error) {
      console.error("Error fetching evolution chain:", error)
      setEvolutionChain([])
    } finally {
      setLoading(false)
    }
  }

  const parseEvolutionChain = async (chainData: any): Promise<EvolutionStage[]> => {
    const chain: EvolutionStage[] = []

    const processStage = async (stage: any, evolutionDetails?: any) => {
      try {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${stage.species.name}`)
        if (pokemonResponse.ok) {
          const pokemonData = await pokemonResponse.json()
          chain.push({
            id: pokemonData.id,
            name: stage.species.name,
            sprite: pokemonData.sprites.other["official-artwork"]?.front_default || pokemonData.sprites.front_default,
            types: pokemonData.types,
            evolutionDetails,
          })
        }
      } catch (error) {
        console.error(`Error fetching ${stage.species.name}:`, error)
      }

      // Process evolutions
      for (const evolution of stage.evolves_to) {
        await processStage(evolution, evolution.evolution_details[0])
      }
    }

    await processStage(chainData)
    return chain
  }

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

  const getEvolutionRequirement = (details: any) => {
    if (!details) return null

    const requirements = []

    if (details.min_level) {
      requirements.push(`Level ${details.min_level}`)
    }

    if (details.item) {
      requirements.push(`Use ${details.item.name.replace("-", " ")}`)
    }

    if (details.held_item) {
      requirements.push(`Hold ${details.held_item.name.replace("-", " ")}`)
    }

    if (details.time_of_day) {
      requirements.push(`${details.time_of_day} time`)
    }

    if (details.location) {
      requirements.push(`At ${details.location.name.replace("-", " ")}`)
    }

    if (details.min_happiness) {
      requirements.push(`Happiness ${details.min_happiness}+`)
    }

    if (details.min_beauty) {
      requirements.push(`Beauty ${details.min_beauty}+`)
    }

    if (details.min_affection) {
      requirements.push(`Affection ${details.min_affection}+`)
    }

    if (details.needs_overworld_rain) {
      requirements.push("During rain")
    }

    if (details.turn_upside_down) {
      requirements.push("Turn console upside down")
    }

    if (details.trade_species) {
      requirements.push(`Trade for ${details.trade_species.name}`)
    }

    if (details.trigger?.name === "trade") {
      requirements.push("Trade")
    }

    if (details.trigger?.name === "use-item") {
      requirements.push("Use item")
    }

    if (details.known_move) {
      requirements.push(`Know ${details.known_move.name.replace("-", " ")}`)
    }

    if (details.known_move_type) {
      requirements.push(`Know ${details.known_move_type.name} move`)
    }

    if (details.party_species) {
      requirements.push(`${details.party_species.name} in party`)
    }

    if (details.party_type) {
      requirements.push(`${details.party_type.name} type in party`)
    }

    if (details.relative_physical_stats === 1) {
      requirements.push("Attack > Defense")
    } else if (details.relative_physical_stats === -1) {
      requirements.push("Defense > Attack")
    } else if (details.relative_physical_stats === 0) {
      requirements.push("Attack = Defense")
    }

    return requirements.length > 0 ? requirements.join(", ") : "Unknown requirement"
  }

  const handlePokemonClick = async (evolutionStage: EvolutionStage) => {
    try {
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${evolutionStage.name}`)
      if (!pokemonResponse.ok) {
        throw new Error(`HTTP error! status: ${pokemonResponse.status}`)
      }
      const pokemonData = await pokemonResponse.json()

      const speciesResponse = await fetch(pokemonData.species.url)
      if (!speciesResponse.ok) {
        throw new Error(`HTTP error! status: ${speciesResponse.status}`)
      }
      const speciesData = await speciesResponse.json()

      onPokemonSelect({
        ...pokemonData,
        species: speciesData,
      })
    } catch (error) {
      console.error("Error fetching Pokémon:", error)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading evolution chain...</p>
        </div>
      </Card>
    )
  }

  if (evolutionChain.length <= 1) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">This Pokémon does not evolve</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4 text-center">Evolution Chain</h4>
      <div className="flex flex-col space-y-4">
        {evolutionChain.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center">
            <Button
              variant="ghost"
              className="p-4 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handlePokemonClick(stage)}
            >
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <Image
                    src={stage.sprite || "/placeholder.svg?height=80&width=80"}
                    alt={stage.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-sm font-medium capitalize mb-1">{stage.name.replace("-", " ")}</div>
                <div className="flex justify-center space-x-1 mb-2">
                  {stage.types.map((type: any) => (
                    <Badge key={type.type.name} className={`${getTypeColor(type.type.name)} text-white text-xs`}>
                      {type.type.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Button>

            {index < evolutionChain.length - 1 && (
              <div className="flex flex-col items-center my-2">
                <ChevronRight className="w-5 h-5 text-gray-400 mb-1" />
                {stage.evolutionDetails && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-32">
                    {getEvolutionRequirement(evolutionChain[index + 1]?.evolutionDetails)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
