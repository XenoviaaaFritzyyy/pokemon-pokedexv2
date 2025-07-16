"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TeamPokemon } from "@/components/team-builder"
import { Shield, Sword, Zap } from "lucide-react"

interface TypeCoverageProps {
  team: TeamPokemon[]
}

const allTypes = [
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

const typeEffectiveness: { [key: string]: { [key: string]: number } } = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, ice: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function TypeCoverage({ team }: TypeCoverageProps) {
  const coverage = useMemo(() => {
    const offensive = new Map<string, number>()
    const defensive = new Map<string, { weaknesses: string[]; resistances: string[]; immunities: string[] }>()

    // Initialize coverage maps
    allTypes.forEach((type) => {
      offensive.set(type, 0)
      defensive.set(type, { weaknesses: [], resistances: [], immunities: [] })
    })

    // Calculate offensive coverage from moves
    team.forEach((member) => {
      member.moves.forEach((move) => {
        const moveType = move.type.name
        allTypes.forEach((defendingType) => {
          const effectiveness = typeEffectiveness[moveType]?.[defendingType] || 1
          if (effectiveness > 1) {
            offensive.set(defendingType, (offensive.get(defendingType) || 0) + 1)
          }
        })
      })
    })

    // Calculate defensive coverage
    team.forEach((member) => {
      const pokemonTypes = member.pokemon.types.map((t: any) => t.type.name)

      allTypes.forEach((attackingType) => {
        let totalEffectiveness = 1

        pokemonTypes.forEach((defType) => {
          const effectiveness = typeEffectiveness[attackingType]?.[defType] || 1
          totalEffectiveness *= effectiveness
        })

        const defenseData = defensive.get(attackingType)!
        if (totalEffectiveness > 1) {
          defenseData.weaknesses.push(member.pokemon.name)
        } else if (totalEffectiveness < 1 && totalEffectiveness > 0) {
          defenseData.resistances.push(member.pokemon.name)
        } else if (totalEffectiveness === 0) {
          defenseData.immunities.push(member.pokemon.name)
        }
      })
    })

    return { offensive, defensive }
  }, [team])

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

  if (team.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-lg">Type Coverage</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Add Pokémon to your team to see type coverage analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Offensive Coverage */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-lg">
              <Sword className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span>Offensive Coverage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allTypes.map((type) => {
            const offensiveCoverage = coverage.offensive.get(type) || 0
            const maxMoves = Math.max(...Array.from(coverage.offensive.values()), 1)
            const percentage = (offensiveCoverage / maxMoves) * 100

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={`${getTypeColor(type)} text-white text-xs px-3 py-1 rounded-full shadow-sm`}>
                    {type}
                  </Badge>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {offensiveCoverage} {offensiveCoverage === 1 ? "move" : "moves"}
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-gray-200 dark:bg-gray-700" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Defensive Analysis */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Defensive Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weaknesses */}
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Team Weaknesses</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {allTypes
                .filter((type) => {
                  const defenseData = coverage.defensive.get(type)!
                  return defenseData.weaknesses.length > 0
                })
                .map((type) => {
                  const defenseData = coverage.defensive.get(type)!
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-2"
                    >
                      <Badge className={`${getTypeColor(type)} text-white text-xs`}>{type}</Badge>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {defenseData.weaknesses.length}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Resistances */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Team Resistances</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {allTypes
                .filter((type) => {
                  const defenseData = coverage.defensive.get(type)!
                  return defenseData.resistances.length > 0
                })
                .map((type) => {
                  const defenseData = coverage.defensive.get(type)!
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-2"
                    >
                      <Badge className={`${getTypeColor(type)} text-white text-xs`}>{type}</Badge>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {defenseData.resistances.length}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Immunities */}
          {allTypes.some((type) => coverage.defensive.get(type)!.immunities.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Team Immunities</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {allTypes
                  .filter((type) => {
                    const defenseData = coverage.defensive.get(type)!
                    return defenseData.immunities.length > 0
                  })
                  .map((type) => {
                    const defenseData = coverage.defensive.get(type)!
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"
                      >
                        <Badge className={`${getTypeColor(type)} text-white text-xs`}>{type}</Badge>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {defenseData.immunities.length}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
