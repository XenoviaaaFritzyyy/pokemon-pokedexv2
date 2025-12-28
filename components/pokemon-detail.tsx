"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { Sparkles, Eye } from "lucide-react"
import { ImagePlaceholder } from "@/components/image-placeholder"

interface PokemonDetailProps {
  pokemon: any
}

export function PokemonDetail({ pokemon }: PokemonDetailProps) {
  const [showShiny, setShowShiny] = useState(false)
  const [show3D, setShow3D] = useState(true)
  const [moves, setMoves] = useState<any[]>([])
  const [typeEffectiveness, setTypeEffectiveness] = useState<any>({})
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (pokemon) {
      fetchMoves()
      fetchTypeEffectiveness()
      setImageError(false)
    }
  }, [pokemon])

  const fetchMoves = async () => {
    try {
      const movePromises = pokemon.moves.slice(0, 10).map(async (move: any) => {
        const response = await fetch(move.move.url)
        return await response.json()
      })
      const moveData = await Promise.all(movePromises)
      setMoves(moveData)
    } catch (error) {
      console.error("Error fetching moves:", error)
    }
  }

  const fetchTypeEffectiveness = async () => {
    try {
      const effectiveness: any = { weakTo: [], resistantTo: [], immuneTo: [] }

      for (const type of pokemon.types) {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type.type.name}`)
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
      }

      setTypeEffectiveness(effectiveness)
    } catch (error) {
      console.error("Error fetching type effectiveness:", error)
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
        ? pokemon.sprites.other["official-artwork"].front_shiny || pokemon.sprites.front_shiny
        : pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default
    } else {
      return showShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default
    }
  }

  const flavorText =
    pokemon.species?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === "en")
      ?.flavor_text?.replace(/\f/g, " ") || "No description available."

  return (
    <Card className="sticky top-6">
      <CardHeader className="text-center">
        <div className="flex justify-center space-x-2 mb-4">
          <Button variant={showShiny ? "default" : "outline"} size="sm" onClick={() => setShowShiny(!showShiny)}>
            <Sparkles className="w-4 h-4 mr-1" />
            Shiny
          </Button>
          <Button variant={show3D ? "default" : "outline"} size="sm" onClick={() => setShow3D(!show3D)}>
            <Eye className="w-4 h-4 mr-1" />
            {show3D ? "3D" : "Sprite"}
          </Button>
        </div>

        <div className="relative w-48 h-48 mx-auto mb-4">
          {imageError || !getSprite() ? (
            <ImagePlaceholder className="w-full h-full" />
          ) : (
            <Image
              src={getSprite() || "/placeholder.svg"}
              alt={pokemon.name}
              fill
              className="object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <CardTitle className="text-2xl capitalize">{pokemon.name.replace("-", " ")}</CardTitle>
        <div className="text-lg text-gray-600 dark:text-gray-400">#{pokemon.id.toString().padStart(3, "0")}</div>

        <div className="flex justify-center space-x-2 mt-2">
          {pokemon.types.map((type: any) => (
            <Badge key={type.type.name} className={`${getTypeColor(type.type.name)} text-white`}>
              {type.type.name}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="moves">Moves</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="space-y-3">
              {pokemon.stats.map((stat: any) => (
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
                <div className="text-2xl font-bold text-blue-600">{(pokemon.height / 10).toFixed(1)}m</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Height</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{(pokemon.weight / 10).toFixed(1)}kg</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weight</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moves" className="space-y-2">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {moves.map((move, index) => (
                <Card key={index} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium capitalize">{move.name.replace("-", " ")}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {move.damage_class?.name} • Power: {move.power || "—"}
                      </div>
                    </div>
                    <Badge className={`${getTypeColor(move.type.name)} text-white`}>{move.type.name}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{flavorText}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Abilities</h4>
                <div className="space-y-1">
                  {pokemon.abilities.map((ability: any) => (
                    <Badge key={ability.ability.name} variant="outline">
                      {ability.ability.name.replace("-", " ")}
                      {ability.is_hidden && " (Hidden)"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Base Experience</h4>
                <div className="text-2xl font-bold text-purple-600">{pokemon.base_experience}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-red-600">Weak To (2x damage)</h4>
              <div className="flex flex-wrap gap-1">
                {typeEffectiveness.weakTo?.map((type: string) => (
                  <Badge key={type} className={`${getTypeColor(type)} text-white`}>
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-green-600">Resistant To (0.5x damage)</h4>
              <div className="flex flex-wrap gap-1">
                {typeEffectiveness.resistantTo?.map((type: string) => (
                  <Badge key={type} className={`${getTypeColor(type)} text-white`}>
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
                    <Badge key={type} className={`${getTypeColor(type)} text-white`}>
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
  )
}
