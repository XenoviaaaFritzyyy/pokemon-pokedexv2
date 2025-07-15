"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EvolutionChain } from "@/components/evolution-chain"
import Image from "next/image"
import { Sparkles, Eye, X } from "lucide-react"

interface PokemonModalProps {
  pokemon: any
  onClose: () => void
}

interface CategorizedMoves {
  levelUp: any[]
  tm: any[]
  tutor: any[]
  egg: any[]
  other: any[]
}

export function PokemonModal({ pokemon, onClose }: PokemonModalProps) {
  const [showShiny, setShowShiny] = useState(false)
  const [show3D, setShow3D] = useState(true)
  const [categorizedMoves, setCategorizedMoves] = useState<CategorizedMoves>({
    levelUp: [],
    tm: [],
    tutor: [],
    egg: [],
    other: [],
  })
  const [typeEffectiveness, setTypeEffectiveness] = useState<any>({})
  const [loadingMoves, setLoadingMoves] = useState(false)
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon)

  useEffect(() => {
    setSelectedPokemon(pokemon)
    if (pokemon) {
      fetchCategorizedMoves()
      fetchTypeEffectiveness()
    }
  }, [pokemon])

  const fetchCategorizedMoves = async () => {
    setLoadingMoves(true)
    try {
      const movePromises = selectedPokemon.moves.map(async (moveEntry: any) => {
        try {
          const response = await fetch(moveEntry.move.url)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const moveData = await response.json()

          const latestVersionGroup = moveEntry.version_group_details[moveEntry.version_group_details.length - 1]

          return {
            ...moveData,
            learnMethod: latestVersionGroup.move_learn_method.name,
            levelLearned: latestVersionGroup.level_learned_at,
            versionGroup: latestVersionGroup.version_group.name,
          }
        } catch (error) {
          console.error(`Error fetching move ${moveEntry.move.name}:`, error)
          return null
        }
      })

      const moves = await Promise.all(movePromises)
      const validMoves = moves.filter(Boolean)

      const categorized: CategorizedMoves = {
        levelUp: [],
        tm: [],
        tutor: [],
        egg: [],
        other: [],
      }

      validMoves.forEach((move) => {
        switch (move.learnMethod) {
          case "level-up":
            categorized.levelUp.push(move)
            break
          case "machine":
            categorized.tm.push(move)
            break
          case "tutor":
            categorized.tutor.push(move)
            break
          case "egg":
            categorized.egg.push(move)
            break
          default:
            categorized.other.push(move)
        }
      })

      categorized.levelUp.sort((a, b) => a.levelLearned - b.levelLearned)

      const sortAlphabetically = (a: any, b: any) => a.name.localeCompare(b.name)
      categorized.tm.sort(sortAlphabetically)
      categorized.tutor.sort(sortAlphabetically)
      categorized.egg.sort(sortAlphabetically)
      categorized.other.sort(sortAlphabetically)

      setCategorizedMoves(categorized)
    } catch (error) {
      console.error("Error fetching moves:", error)
      setCategorizedMoves({
        levelUp: [],
        tm: [],
        tutor: [],
        egg: [],
        other: [],
      })
    } finally {
      setLoadingMoves(false)
    }
  }

  const fetchTypeEffectiveness = async () => {
    try {
      const effectiveness: any = { weakTo: [], resistantTo: [], immuneTo: [] }

      for (const type of selectedPokemon.types) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/type/${type.type.name}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const typeData = await response.json()

          typeData.damage_relations.double_damage_from.forEach((t: any) => {
            if (!effectiveness.weakTo.includes(t.name)) {
              effectiveness.weakTo.push(t.name)
            }
          })

          typeData.damage_relations.half_damage_from.forEach((t: any) => {
            if (!effectiveness.resistantTo.includes(t.name)) {
              effectiveness.resistantTo.push(t.name)
            }
          })

          typeData.damage_relations.no_damage_from.forEach((t: any) => {
            if (!effectiveness.immuneTo.includes(t.name)) {
              effectiveness.immuneTo.push(t.name)
            }
          })
        } catch (error) {
          console.error(`Error fetching type data for ${type.type.name}:`, error)
        }
      }

      setTypeEffectiveness(effectiveness)
    } catch (error) {
      console.error("Error fetching type effectiveness:", error)
      setTypeEffectiveness({ weakTo: [], resistantTo: [], immuneTo: [] })
    }
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

  const getSprite = () => {
    if (show3D) {
      return showShiny
        ? selectedPokemon.sprites.other["official-artwork"]?.front_shiny || selectedPokemon.sprites.front_shiny
        : selectedPokemon.sprites.other["official-artwork"]?.front_default || selectedPokemon.sprites.front_default
    } else {
      if (showShiny) {
        return (
          selectedPokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_shiny ||
          selectedPokemon.sprites.front_shiny ||
          "/placeholder.svg?height=192&width=192"
        )
      } else {
        return (
          selectedPokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ||
          selectedPokemon.sprites.front_default ||
          "/placeholder.svg?height=192&width=192"
        )
      }
    }
  }

  const getDisplayName = (name: string) => {
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

  const renderMoveList = (moves: any[], showLevel = false) => {
    if (moves.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400 text-sm">No moves available</p>
    }

    return (
      <div className="space-y-2">
        {moves.map((move, index) => (
          <Card key={index} className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
              <div className="flex-1">
                <div className="font-medium capitalize text-sm sm:text-base">{move.name.replace("-", " ")}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {move.damage_class?.name} • Power: {move.power || "—"} • PP: {move.pp || "—"}
                  {showLevel && move.levelLearned > 0 && ` • Level ${move.levelLearned}`}
                </div>
                {move.effect_entries?.[0] && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {move.effect_entries[0].short_effect}
                  </div>
                )}
              </div>
              <Badge className={`${getTypeColor(move.type.name)} text-white ml-0 sm:ml-2 self-start`}>
                {move.type.name}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const flavorText =
    selectedPokemon.species?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === "en")
      ?.flavor_text?.replace(/\f/g, " ") || "No description available."

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white capitalize">
            {getDisplayName(selectedPokemon.name)} Details
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)]">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center p-3 sm:p-6">
              <div className="flex justify-center space-x-2 mb-4">
                <Button
                  variant={showShiny ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowShiny(!showShiny)}
                  className="text-xs sm:text-sm"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Shiny
                </Button>
                <Button
                  variant={show3D ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShow3D(!show3D)}
                  className="text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {show3D ? "3D" : "Sprite"}
                </Button>
              </div>

              <div className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-4">
                <Image
                  src={getSprite() || "/placeholder.svg?height=192&width=192"}
                  alt={selectedPokemon.name}
                  fill
                  className="object-contain"
                />
              </div>

              <CardTitle className="text-xl sm:text-2xl capitalize">{getDisplayName(selectedPokemon.name)}</CardTitle>
              <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                #{selectedPokemon.id.toString().padStart(3, "0")}
              </div>

              <div className="flex justify-center space-x-2 mt-2">
                {selectedPokemon.types.map((type: any) => (
                  <Badge
                    key={type.type.name}
                    className={`${getTypeColor(type.type.name)} text-white text-xs sm:text-sm`}
                  >
                    {type.type.name}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6">
              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="grid w-full grid-cols-5 text-xs sm:text-sm">
                  <TabsTrigger value="stats" className="px-1 sm:px-3">
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="moves" className="px-1 sm:px-3">
                    Moves
                  </TabsTrigger>
                  <TabsTrigger value="evolution" className="px-1 sm:px-3">
                    Evolution
                  </TabsTrigger>
                  <TabsTrigger value="info" className="px-1 sm:px-3">
                    Info
                  </TabsTrigger>
                  <TabsTrigger value="types" className="px-1 sm:px-3">
                    Types
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {selectedPokemon.stats.map((stat: any) => (
                      <div key={stat.stat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{stat.stat.name.replace("-", " ")}</span>
                          <span className="font-bold">{stat.base_stat}</span>
                        </div>
                        <Progress value={(stat.base_stat / 255) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        {(selectedPokemon.height / 10).toFixed(1)}m
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Height</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {(selectedPokemon.weight / 10).toFixed(1)}kg
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weight</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="moves" className="space-y-4 mt-4">
                  {loadingMoves ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Loading moves...</p>
                    </div>
                  ) : (
                    <Tabs defaultValue="levelup" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 text-xs">
                        <TabsTrigger value="levelup">Level</TabsTrigger>
                        <TabsTrigger value="tm">TM/HM</TabsTrigger>
                        <TabsTrigger value="tutor">Tutor</TabsTrigger>
                        <TabsTrigger value="egg">Egg</TabsTrigger>
                        <TabsTrigger value="other">Other</TabsTrigger>
                      </TabsList>

                      <TabsContent value="levelup">
                        <ScrollArea className="h-48 sm:h-64">
                          {renderMoveList(categorizedMoves.levelUp, true)}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="tm">
                        <ScrollArea className="h-48 sm:h-64">{renderMoveList(categorizedMoves.tm)}</ScrollArea>
                      </TabsContent>

                      <TabsContent value="tutor">
                        <ScrollArea className="h-48 sm:h-64">{renderMoveList(categorizedMoves.tutor)}</ScrollArea>
                      </TabsContent>

                      <TabsContent value="egg">
                        <ScrollArea className="h-48 sm:h-64">{renderMoveList(categorizedMoves.egg)}</ScrollArea>
                      </TabsContent>

                      <TabsContent value="other">
                        <ScrollArea className="h-48 sm:h-64">{renderMoveList(categorizedMoves.other)}</ScrollArea>
                      </TabsContent>
                    </Tabs>
                  )}
                </TabsContent>

                <TabsContent value="evolution" className="mt-4">
                  <EvolutionChain pokemon={selectedPokemon} onPokemonSelect={setSelectedPokemon} />
                </TabsContent>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{flavorText}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Abilities</h4>
                      <div className="space-y-1">
                        {selectedPokemon.abilities.map((ability: any) => (
                          <Badge key={ability.ability.name} variant="outline" className="text-xs">
                            {ability.ability.name.replace("-", " ")}
                            {ability.is_hidden && " (Hidden)"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Base Experience</h4>
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {selectedPokemon.base_experience}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="types" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Weak To (2x damage)</h4>
                    <div className="flex flex-wrap gap-1">
                      {typeEffectiveness.weakTo?.map((type: string) => (
                        <Badge key={type} className={`${getTypeColor(type)} text-white text-xs`}>
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Resistant To (0.5x damage)</h4>
                    <div className="flex flex-wrap gap-1">
                      {typeEffectiveness.resistantTo?.map((type: string) => (
                        <Badge key={type} className={`${getTypeColor(type)} text-white text-xs`}>
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {typeEffectiveness.immuneTo?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-600">Immune To (0x damage)</h4>
                      <div className="flex flex-wrap gap-1">
                        {typeEffectiveness.immuneTo.map((type: string) => (
                          <Badge key={type} className={`${getTypeColor(type)} text-white text-xs`}>
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
