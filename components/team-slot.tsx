"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TeamPokemon } from "@/components/team-builder"
import { Plus, X, Trash2, Search } from "lucide-react"
import { ImagePlaceholder } from "@/components/image-placeholder"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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
  const [imageError, setImageError] = useState(false)
  const [moveSearchOpen, setMoveSearchOpen] = useState(false)
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [moveSearchQuery, setMoveSearchQuery] = useState("")
  const [itemSearchQuery, setItemSearchQuery] = useState("")

  useEffect(() => {
    if (teamMember?.pokemon) {
      fetchMoves()
      fetchHeldItems()
      setImageError(false)
    }
  }, [teamMember])

  const fetchMoves = async () => {
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

  const categorizedMoves = {
    "level-up": filteredMoves.filter(
      (m) =>
        m.learnMethod === "level-up" &&
        (moveSearchQuery === "" || m.name.toLowerCase().includes(moveSearchQuery.toLowerCase())),
    ),
    machine: filteredMoves.filter(
      (m) =>
        m.learnMethod === "machine" &&
        (moveSearchQuery === "" || m.name.toLowerCase().includes(moveSearchQuery.toLowerCase())),
    ),
    egg: filteredMoves.filter(
      (m) =>
        m.learnMethod === "egg" &&
        (moveSearchQuery === "" || m.name.toLowerCase().includes(moveSearchQuery.toLowerCase())),
    ),
    tutor: filteredMoves.filter(
      (m) =>
        m.learnMethod === "tutor" &&
        (moveSearchQuery === "" || m.name.toLowerCase().includes(moveSearchQuery.toLowerCase())),
    ),
    other: filteredMoves.filter(
      (m) =>
        !["level-up", "machine", "egg", "tutor"].includes(m.learnMethod) &&
        (moveSearchQuery === "" || m.name.toLowerCase().includes(moveSearchQuery.toLowerCase())),
    ),
  }

  const filteredItems = availableItems.filter(
    (item) => itemSearchQuery === "" || item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()),
  )

  if (!teamMember) {
    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 min-h-[200px] flex items-center justify-center group cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Button
            onClick={onAddPokemon}
            variant="ghost"
            className="flex flex-col items-center space-y-3 h-auto py-6 px-8 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 group-hover:scale-105"
          >
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full group-hover:shadow-lg transition-shadow">
              <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-lg font-semibold text-gray-700 dark:text-white">Add Pokémon</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Slot {slotIndex + 1}</span>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden group">
      <CardContent className="p-6 space-y-6">
        {/* Pokemon Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-300">
              {imageError ? (
                <ImagePlaceholder name={teamMember.pokemon.name} />
              ) : (
                <img
                  src={
                    teamMember.pokemon.sprites?.other?.["official-artwork"]?.front_default ||
                    teamMember.pokemon.sprites?.front_default ||
                    "/placeholder.svg?height=80&width=80" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={teamMember.pokemon.name}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold capitalize text-gray-800 dark:text-white">{teamMember.pokemon.name}</h3>
              <div className="flex flex-wrap gap-2">
                {teamMember.pokemon.types?.map((type: any) => (
                  <Badge key={type.type.name} className={`${getTypeColor(type.type.name)} text-white text-xs`}>
                    {type.type.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemovePokemon}
            className="hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </Button>
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Nickname</h4>
          <Input
            type="text"
            placeholder={`Enter nickname for ${teamMember.pokemon.name}`}
            value={teamMember.nickname || ""}
            onChange={(e) => onUpdateMember({ nickname: e.target.value })}
            className="h-10 rounded-lg"
          />
        </div>

        {/* Moves Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Moves ({teamMember.moves.length}/4)
            </h4>
          </div>

          <div className="space-y-2">
            {teamMember.moves.map((move: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                    {move.type.name}
                  </Badge>
                  <span className="capitalize font-medium text-sm">{move.name.replace("-", " ")}</span>
                  {move.power && <span className="text-xs text-gray-500">{move.power} PWR</span>}
                  {move.accuracy && <span className="text-xs text-gray-500">{move.accuracy}% ACC</span>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMove(index)}
                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full shrink-0"
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {teamMember.moves.length < 4 && (
            <Popover open={moveSearchOpen} onOpenChange={setMoveSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-lg border-dashed border-purple-300 hover:border-purple-400 transition-colors justify-start text-muted-foreground bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add move...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search moves..."
                    value={moveSearchQuery}
                    onValueChange={setMoveSearchQuery}
                  />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>No moves found.</CommandEmpty>

                    {categorizedMoves["level-up"].length > 0 && (
                      <CommandGroup heading="Level Up">
                        {categorizedMoves["level-up"].map((move) => (
                          <CommandItem
                            key={move.name}
                            value={move.name}
                            onSelect={() => {
                              addMove(move)
                              setMoveSearchOpen(false)
                              setMoveSearchQuery("")
                            }}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                                {move.type.name}
                              </Badge>
                              <span className="capitalize text-sm">{move.name.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0">
                              {move.levelLearned > 0 && <span>Lv.{move.levelLearned}</span>}
                              {move.power && <span>{move.power} PWR</span>}
                              <Badge variant="outline" className="text-xs">
                                {move.damage_class?.name || "status"}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {categorizedMoves.machine.length > 0 && (
                      <CommandGroup heading="TM/HM">
                        {categorizedMoves.machine.map((move) => (
                          <CommandItem
                            key={move.name}
                            value={move.name}
                            onSelect={() => {
                              addMove(move)
                              setMoveSearchOpen(false)
                              setMoveSearchQuery("")
                            }}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                                {move.type.name}
                              </Badge>
                              <span className="capitalize text-sm">{move.name.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0">
                              {move.power && <span>{move.power} PWR</span>}
                              <Badge variant="outline" className="text-xs">
                                {move.damage_class?.name || "status"}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {categorizedMoves.egg.length > 0 && (
                      <CommandGroup heading="Egg Moves">
                        {categorizedMoves.egg.map((move) => (
                          <CommandItem
                            key={move.name}
                            value={move.name}
                            onSelect={() => {
                              addMove(move)
                              setMoveSearchOpen(false)
                              setMoveSearchQuery("")
                            }}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                                {move.type.name}
                              </Badge>
                              <span className="capitalize text-sm">{move.name.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0">
                              {move.power && <span>{move.power} PWR</span>}
                              <Badge variant="outline" className="text-xs">
                                {move.damage_class?.name || "status"}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {categorizedMoves.tutor.length > 0 && (
                      <CommandGroup heading="Tutor Moves">
                        {categorizedMoves.tutor.map((move) => (
                          <CommandItem
                            key={move.name}
                            value={move.name}
                            onSelect={() => {
                              addMove(move)
                              setMoveSearchOpen(false)
                              setMoveSearchQuery("")
                            }}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                                {move.type.name}
                              </Badge>
                              <span className="capitalize text-sm">{move.name.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0">
                              {move.power && <span>{move.power} PWR</span>}
                              <Badge variant="outline" className="text-xs">
                                {move.damage_class?.name || "status"}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {categorizedMoves.other.length > 0 && (
                      <CommandGroup heading="Other">
                        {categorizedMoves.other.map((move) => (
                          <CommandItem
                            key={move.name}
                            value={move.name}
                            onSelect={() => {
                              addMove(move)
                              setMoveSearchOpen(false)
                              setMoveSearchQuery("")
                            }}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <Badge className={`${getTypeColor(move.type.name)} text-white text-xs shrink-0`}>
                                {move.type.name}
                              </Badge>
                              <span className="capitalize text-sm">{move.name.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0">
                              {move.power && <span>{move.power} PWR</span>}
                              <Badge variant="outline" className="text-xs">
                                {move.damage_class?.name || "status"}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Held Item</h4>
            <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-lg justify-between text-left font-normal bg-transparent"
                  role="combobox"
                  aria-expanded={itemSearchOpen}
                >
                  <span className="capitalize truncate">
                    {teamMember.heldItem ? teamMember.heldItem.name.replace("-", " ") : "No item"}
                  </span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search items..."
                    value={itemSearchQuery}
                    onValueChange={setItemSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          onUpdateMember({ heldItem: null })
                          setItemSearchOpen(false)
                          setItemSearchQuery("")
                        }}
                      >
                        <span className="text-gray-500 italic">No item</span>
                      </CommandItem>
                      <ScrollArea className="h-[300px]">
                        {filteredItems.map((item) => (
                          <CommandItem
                            key={item.name}
                            value={item.name}
                            onSelect={() => {
                              onUpdateMember({ heldItem: item })
                              setItemSearchOpen(false)
                              setItemSearchQuery("")
                            }}
                          >
                            <span className="capitalize">{item.name.replace("-", " ")}</span>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
