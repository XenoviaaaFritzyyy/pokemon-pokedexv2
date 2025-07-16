"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TeamPokemon } from "@/components/team-builder"
import { Plus, X, Edit2, Check, Sparkles } from "lucide-react"
import Image from "next/image"

interface TeamSlotProps {
  slotIndex: number
  teamMember: TeamPokemon | null
  onAddPokemon: () => void
  onUpdateMember: (updates: Partial<TeamPokemon>) => void
  onRemovePokemon: () => void
}

const natures = [
  "hardy",
  "lonely",
  "brave",
  "adamant",
  "naughty",
  "bold",
  "docile",
  "relaxed",
  "impish",
  "lax",
  "timid",
  "hasty",
  "serious",
  "jolly",
  "naive",
  "modest",
  "mild",
  "quiet",
  "bashful",
  "rash",
  "calm",
  "gentle",
  "sassy",
  "careful",
  "quirky",
]

export function TeamSlot({ slotIndex, teamMember, onAddPokemon, onUpdateMember, onRemovePokemon }: TeamSlotProps) {
  const [availableMoves, setAvailableMoves] = useState<any[]>([])
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [loadingMoves, setLoadingMoves] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [/*moveSearchOpen*/ /*setMoveSearchOpen*/ ,] = useState(false)
  const [/*moveSearchValue*/ /*setMoveSearchValue*/ ,] = useState("")
  const [/*itemSearchOpen*/ /*setItemSearchOpen*/ ,] = useState(false)

  useEffect(() => {
    if (teamMember) {
      fetchPokemonMoves()
      fetchHeldItems()
      setNicknameInput(teamMember.nickname || "")
    }
  }, [teamMember])

  const fetchPokemonMoves = async () => {
    if (!teamMember) return

    setLoadingMoves(true)
    try {
      const movePromises = teamMember.pokemon.moves.map(async (moveEntry: any) => {
        try {
          const response = await fetch(moveEntry.move.url)
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          const moveData = await response.json()

          const latestVersionGroup = moveEntry.version_group_details[moveEntry.version_group_details.length - 1]

          return {
            ...moveData,
            learnMethod: latestVersionGroup.move_learn_method.name,
            levelLearned: latestVersionGroup.level_learned_at,
          }
        } catch (error) {
          console.error(`Error fetching move ${moveEntry.move.name}:`, error)
          return null
        }
      })

      const moves = await Promise.all(movePromises)
      setAvailableMoves(moves.filter(Boolean))
    } catch (error) {
      console.error("Error fetching moves:", error)
    } finally {
      setLoadingMoves(false)
    }
  }

  const fetchHeldItems = async () => {
    setLoadingItems(true)
    try {
      // Fetch held items specifically (categories that are typically held items)
      const heldItemCategories = [
        "held-items",
        "choice",
        "effort-training",
        "bad-held-items",
        "training",
        "plates",
        "species-specific",
        "type-enhancement",
        "stat-boosts",
        "damage",
        "healing",
        "pp-recovery",
        "revival",
        "status-cures",
        "other",
        "in-a-pinch",
        "picky-healing",
      ]

      const allItems: any[] = []

      // Get items from multiple pages to ensure we get held items
      for (let offset = 0; offset < 400; offset += 100) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/item?limit=100&offset=${offset}`)
          if (!response.ok) continue

          const data = await response.json()

          const itemPromises = data.results.map(async (item: any) => {
            try {
              const itemResponse = await fetch(item.url)
              if (!itemResponse.ok) return null
              const itemData = await itemResponse.json()

              // Filter for actual held items (exclude key items, pokeballs, etc.)
              const isHeldItem =
                itemData.category &&
                (itemData.category.name.includes("held") ||
                  itemData.category.name.includes("choice") ||
                  itemData.category.name.includes("training") ||
                  itemData.category.name.includes("plates") ||
                  itemData.category.name.includes("type-enhancement") ||
                  itemData.category.name.includes("stat-boosts") ||
                  itemData.category.name.includes("damage") ||
                  itemData.category.name.includes("healing") ||
                  itemData.category.name.includes("berries") ||
                  itemData.category.name === "other")

              // Also include specific important items
              const importantItems = [
                "leftovers",
                "choice-band",
                "choice-scarf",
                "choice-specs",
                "life-orb",
                "focus-sash",
                "assault-vest",
                "rocky-helmet",
                "weakness-policy",
                "eviolite",
                "heavy-duty-boots",
                "safety-goggles",
                "mental-herb",
                "white-herb",
                "power-herb",
                "big-root",
                "scope-lens",
                "wide-lens",
                "zoom-lens",
                "metronome",
                "expert-belt",
                "muscle-band",
                "wise-glasses",
                "razor-claw",
                "razor-fang",
                "quick-claw",
                "kings-rock",
                "bright-powder",
                "lax-incense",
                "shell-bell",
                "soothe-bell",
                "smoke-ball",
                "shed-shell",
                "grip-claw",
                "sticky-barb",
                "iron-ball",
                "flame-orb",
                "toxic-orb",
                "black-sludge",
                "sticky-hold",
              ]

              if (isHeldItem || importantItems.includes(itemData.name)) {
                return itemData
              }

              return null
            } catch (error) {
              return null
            }
          })

          const items = await Promise.all(itemPromises)
          allItems.push(...items.filter(Boolean))
        } catch (error) {
          console.error("Error fetching items batch:", error)
        }
      }

      // Add mega stones manually since they might not be in the regular item list
      const megaStones = [
        "venusaurite",
        "charizardite-x",
        "charizardite-y",
        "blastoisinite",
        "alakazite",
        "gengarite",
        "kangaskhanite",
        "pinsirite",
        "gyaradosite",
        "aerodactylite",
        "mewtwonite-x",
        "mewtwonite-y",
        "ampharosite",
        "scizorite",
        "heracronite",
        "houndoominite",
        "tyranitarite",
        "blazikenite",
        "gardevoirite",
        "mawilite",
        "aggronite",
        "medichamite",
        "manectite",
        "banettite",
        "banettite",
        "absolite",
        "latiasite",
        "latiosite",
        "garchompite",
        "lucarionite",
        "abomasite",
      ]

      for (const stone of megaStones) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/item/${stone}`)
          if (response.ok) {
            const stoneData = await response.json()
            allItems.push(stoneData)
          }
        } catch (error) {
          // Ignore errors for individual mega stones
        }
      }

      // Remove duplicates and sort
      const uniqueItems = allItems.filter((item, index, self) => index === self.findIndex((i) => i.name === item.name))

      uniqueItems.sort((a, b) => a.name.localeCompare(b.name))
      setAvailableItems(uniqueItems)
    } catch (error) {
      console.error("Error fetching held items:", error)
    } finally {
      setLoadingItems(false)
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

  const addMove = (move: any) => {
    if (!teamMember || teamMember.moves.length >= 4) return

    const newMoves = [...teamMember.moves, move]
    onUpdateMember({ moves: newMoves })
  }

  const removeMove = (moveIndex: number) => {
    if (!teamMember) return

    const newMoves = teamMember.moves.filter((_, index) => index !== moveIndex)
    onUpdateMember({ moves: newMoves })
  }

  const updateNickname = () => {
    if (!teamMember) return
    onUpdateMember({ nickname: nicknameInput })
    setEditingNickname(false)
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

  const filteredMoves = availableMoves.filter((move) => !teamMember?.moves.some((m) => m.name === move.name))

  if (!teamMember) {
    return (
      <Card className="group relative overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="flex items-center justify-center h-64 p-6">
          <Button
            variant="ghost"
            onClick={onAddPokemon}
            className="flex flex-col items-center space-y-3 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-all duration-300 hover:scale-110 p-8 rounded-2xl"
          >
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-800 dark:group-hover:to-pink-800 transition-all duration-300">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-medium">Add Pokémon</span>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemovePokemon}
        className="absolute top-3 right-3 z-10 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 hover:scale-110"
      >
        <X className="w-4 h-4" />
      </Button>

      <CardContent className="p-6 space-y-6">
        {/* Pokemon Header */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-2 shadow-inner">
              <Image
                src={
                  teamMember.pokemon.sprites.other["official-artwork"]?.front_default ||
                  teamMember.pokemon.sprites.front_default ||
                  "/placeholder.svg?height=80&width=80" ||
                  "/placeholder.svg" ||
                  "/placeholder.svg" ||
                  "/placeholder.svg"
                }
                alt={teamMember.pokemon.name}
                width={80}
                height={80}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {editingNickname ? (
                <div className="flex items-center space-x-2 w-full">
                  <Input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="h-8 text-sm rounded-lg border-purple-200 focus:border-purple-400"
                    placeholder="Enter nickname..."
                  />
                  <Button size="icon" variant="ghost" onClick={updateNickname} className="h-8 w-8 hover:bg-green-100">
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 w-full">
                  <h3 className="font-bold text-lg capitalize truncate bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    {teamMember.nickname || getDisplayName(teamMember.pokemon.name)}
                  </h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingNickname(true)}
                    className="h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  >
                    <Edit2 className="w-3 h-3 text-blue-600" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {teamMember.pokemon.types.map((type: any) => (
                <Badge
                  key={type.type.name}
                  className={`${getTypeColor(type.type.name)} text-white text-xs px-2 py-1 rounded-full shadow-sm`}
                >
                  {type.type.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-4">
          {/* Moves Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span>Moves ({teamMember.moves.length}/4)</span>
            </h4>

            <div className="space-y-2">
              {teamMember.moves.map((move, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shadow-sm`}>
                      {move.type.name}
                    </Badge>
                    <span className="text-sm font-medium capitalize">{move.name.replace("-", " ")}</span>
                    {move.power && (
                      <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        {move.power} PWR
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeMove(index)}
                    className="h-6 w-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {teamMember.moves.length < 4 && (
              <Select
                onValueChange={(value) => {
                  const move = availableMoves.find((m) => m.name === value)
                  if (move) addMove(move)
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-lg border-dashed border-purple-300 hover:border-purple-400 transition-colors">
                  <SelectValue placeholder="Add move..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    {filteredMoves.map((move) => (
                      <SelectItem key={move.name} value={move.name}>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getTypeColor(move.type.name)} text-white text-xs`}>
                            {move.type.name}
                          </Badge>
                          <span className="capitalize">{move.name.replace("-", " ")}</span>
                          {move.power && <span className="text-xs text-gray-500">{move.power} PWR</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nature and Item Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nature */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Nature</h4>
              <Select value={teamMember.nature || "hardy"} onValueChange={(value) => onUpdateMember({ nature: value })}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {natures.map((nature) => (
                      <SelectItem key={nature} value={nature}>
                        <span className="capitalize">{nature}</span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Held Item */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Held Item</h4>
              <Select
                value={teamMember.heldItem?.name || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onUpdateMember({ heldItem: null })
                  } else {
                    const item = availableItems.find((i) => i.name === value)
                    if (item) onUpdateMember({ heldItem: item })
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    <SelectItem value="none">
                      <span className="text-gray-500">No item</span>
                    </SelectItem>
                    {availableItems.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        <span className="capitalize">{item.name.replace("-", " ")}</span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
