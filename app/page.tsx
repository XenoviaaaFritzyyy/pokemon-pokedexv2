"use client"

import { useState, useEffect, useCallback } from "react"
import { PokemonGrid } from "@/components/pokemon-grid"
import { PokemonModal } from "@/components/pokemon-modal"
import { Navigation } from "@/components/navigation"
import { FilterBar } from "@/components/filter-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { TeamBuilder } from "@/components/team-builder"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function Home() {
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null)
  const [currentCategory, setCurrentCategory] = useState("national")
  const [currentGeneration, setCurrentGeneration] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("id")
  const [typeFilter1, setTypeFilter1] = useState("all")
  const [typeFilter2, setTypeFilter2] = useState("all")
  const [pokemonData, setPokemonData] = useState<any[]>([])
  const [displayedPokemon, setDisplayedPokemon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ITEMS_PER_PAGE = 20
  const BATCH_SIZE = 50

  // Generation ranges
  const generationRanges = {
    gen1: { start: 1, end: 151 },
    gen2: { start: 152, end: 251 },
    gen3: { start: 252, end: 386 },
    gen4: { start: 387, end: 493 },
    gen5: { start: 494, end: 649 },
    gen6: { start: 650, end: 721 },
    gen7: { start: 722, end: 809 },
    gen8: { start: 810, end: 905 },
    gen9: { start: 906, end: 1025 },
  }

  useEffect(() => {
    if (currentCategory === "national") {
      fetchAllPokemon()
    } else if (currentCategory === "team-builder") {
      // Team builder doesn't need to fetch all Pokemon initially
      setLoading(false)
      setPokemonData([])
      setDisplayedPokemon([])
    } else {
      fetchSpecialForms()
    }
  }, [currentCategory])

  useEffect(() => {
    if (currentCategory !== "team-builder") {
      filterAndDisplayPokemon()
    }
  }, [pokemonData, currentGeneration, searchTerm, sortBy, typeFilter1, typeFilter2])

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const fetchPokemonBatch = async (startId: number, endId: number): Promise<any[]> => {
    const results: any[] = []
    const SUB_BATCH_SIZE = 5 // Smaller sub-batches to avoid overwhelming the API

    for (let i = startId; i <= endId; i += SUB_BATCH_SIZE) {
      const subBatchEnd = Math.min(i + SUB_BATCH_SIZE - 1, endId)
      const subBatchPromises = []

      for (let j = i; j <= subBatchEnd; j++) {
        subBatchPromises.push(
          fetch(`https://pokeapi.co/api/v2/pokemon/${j}`)
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }
              const pokemonData = await response.json()

              const speciesResponse = await fetch(pokemonData.species.url)
              if (!speciesResponse.ok) {
                throw new Error(`HTTP error! status: ${speciesResponse.status}`)
              }
              const speciesData = await speciesResponse.json()

              return {
                ...pokemonData,
                species: speciesData,
              }
            })
            .catch((error) => {
              // Silently fail to avoid console spam
              return null
            }),
        )
      }

      const subResults = await Promise.all(subBatchPromises)
      results.push(...subResults.filter(Boolean))
      
      // Small delay between sub-batches to prevent rate limiting
      if (i + SUB_BATCH_SIZE <= endId) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    return results
  }

  const fetchAllPokemon = async () => {
    setLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      const allPokemon: any[] = []
      const totalPokemon = 1025
      const totalBatches = Math.ceil(totalPokemon / BATCH_SIZE)

      for (let batch = 0; batch < totalBatches; batch++) {
        const startId = batch * BATCH_SIZE + 1
        const endId = Math.min((batch + 1) * BATCH_SIZE, totalPokemon)

        try {
          const batchData = await fetchPokemonBatch(startId, endId)
          allPokemon.push(...batchData)

          const progress = ((batch + 1) / totalBatches) * 100
          setLoadingProgress(progress)

          // Increased delay to mitigate potential rate limiting issues
          if (batch < totalBatches - 1) {
            await delay(200)
          }
        } catch (error) {
          console.error(`Error fetching batch ${batch + 1}:`, error)
        }
      }

      allPokemon.sort((a, b) => a.id - b.id)
      setPokemonData(allPokemon)

      if (allPokemon.length === 0) {
        setError("Failed to load Pokémon data. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching Pokémon data:", error)
      setError("Failed to load Pokémon data. Please check your internet connection and try again.")
    } finally {
      setLoading(false)
      setLoadingProgress(100)
    }
  }

  const fetchSpecialForms = async () => {
    setLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      let specialPokemon: any[] = []

      if (currentCategory === "regional") {
        specialPokemon = await fetchRegionalForms()
      } else if (currentCategory === "mega") {
        specialPokemon = await fetchMegaEvolutions()
      } else if (currentCategory === "gmax") {
        specialPokemon = await fetchGigantamaxForms()
      }

      setPokemonData(specialPokemon)
      setLoadingProgress(100)
    } catch (error) {
      console.error("Error fetching special forms:", error)
      setError("Failed to load special forms. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchRegionalForms = async (): Promise<any[]> => {
    const regionalForms: any[] = []
    const regionalVariants = [
      // Alolan forms
      "rattata-alola",
      "raticate-alola",
      "raichu-alola",
      "sandshrew-alola",
      "sandslash-alola",
      "vulpix-alola",
      "ninetales-alola",
      "diglett-alola",
      "dugtrio-alola",
      "meowth-alola",
      "persian-alola",
      "geodude-alola",
      "graveler-alola",
      "golem-alola",
      "grimer-alola",
      "muk-alola",
      "exeggutor-alola",
      "marowak-alola",
      // Galarian forms
      "meowth-galar",
      "ponyta-galar",
      "rapidash-galar",
      "slowpoke-galar",
      "slowbro-galar",
      "farfetchd-galar",
      "weezing-galar",
      "mr-mime-galar",
      "articuno-galar",
      "zapdos-galar",
      "moltres-galar",
      "slowking-galar",
      "corsola-galar",
      "zigzagoon-galar",
      "linoone-galar",
      "darumaka-galar",
      "darmanitan-galar",
      "yamask-galar",
      "stunfisk-galar",
      // Hisuian forms
      "growlithe-hisui",
      "arcanine-hisui",
      "voltorb-hisui",
      "electrode-hisui",
      "typhlosion-hisui",
      "qwilfish-hisui",
      "sneasel-hisui",
      "samurott-hisui",
      "lilligant-hisui",
      "zorua-hisui",
      "zoroark-hisui",
      "braviary-hisui",
      "sliggoo-hisui",
      "goodra-hisui",
      "avalugg-hisui",
      "decidueye-hisui",
      // Paldean forms
      "tauros-paldea-combat",
      "tauros-paldea-blaze",
      "tauros-paldea-aqua",
      "wooper-paldea",
    ]

    setLoadingProgress(25)

    for (const variant of regionalVariants) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variant}`)
        if (response.ok) {
          const pokemonData = await response.json()
          const speciesResponse = await fetch(pokemonData.species.url)
          if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json()
            regionalForms.push({
              ...pokemonData,
              species: speciesData,
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching ${variant}:`, error)
      }
    }

    setLoadingProgress(100)
    return regionalForms
  }

  const fetchMegaEvolutions = async (): Promise<any[]> => {
    const megaEvolutions: any[] = []
    const megaVariants = [
      "kyogre-primal",
      "groudon-primal",
      // Original Mega Evolutions (Gen 6 - all verified to exist in PokeAPI)
      "venusaur-mega",
      "charizard-mega-x",
      "charizard-mega-y",
      "blastoise-mega",
      "alakazam-mega",
      "gengar-mega",
      "kangaskhan-mega",
      "pinsir-mega",
      "gyarados-mega",
      "aerodactyl-mega",
      "mewtwo-mega-x",
      "mewtwo-mega-y",
      "ampharos-mega",
      "scizor-mega",
      "heracross-mega",
      "houndoom-mega",
      "tyranitar-mega",
      "blaziken-mega",
      "gardevoir-mega",
      "mawile-mega",
      "aggron-mega",
      "medicham-mega",
      "manectric-mega",
      "banette-mega",
      "absol-mega",
      "latios-mega",
      "latias-mega",
      "garchomp-mega",
      "lucario-mega",
      "abomasnow-mega",
      "beedrill-mega",
      "pidgeot-mega",
      "slowbro-mega",
      "steelix-mega",
      "sceptile-mega",
      "swampert-mega",
      "camerupt-mega",
      "altaria-mega",
      "glalie-mega",
      "salamence-mega",
      "metagross-mega",
      "rayquaza-mega",
      "lopunny-mega",
      "gallade-mega",
      "audino-mega",
      "sharpedo-mega",
      "diancie-mega",
      // Legends Z-A Mega Evolutions (to be checked if available in PokeAPI)
      "dragonite-mega",
      "zeraora-mega",
      "volcarona-mega",
      "hydreigon-mega",
      "archeops-mega",
    ]

    setLoadingProgress(25)

    // Batch fetch with optimized promises for better performance
    const BATCH_SIZE = 10
    for (let i = 0; i < megaVariants.length; i += BATCH_SIZE) {
      const batch = megaVariants.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (variant) => {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variant}`)
          if (response.ok) {
            const pokemonData = await response.json()
            const speciesResponse = await fetch(pokemonData.species.url)
            if (speciesResponse.ok) {
              const speciesData = await speciesResponse.json()
              return {
                ...pokemonData,
                species: speciesData,
              }
            }
          }
        } catch (error) {
          // Silently skip unavailable Legends Z-A megas
        }
        return null
      })

      const results = await Promise.all(batchPromises)
      megaEvolutions.push(...results.filter(Boolean))
      
      // Update progress
      const progress = 25 + ((i + BATCH_SIZE) / megaVariants.length) * 75
      setLoadingProgress(Math.min(progress, 99))
    }

    setLoadingProgress(100)
    return megaEvolutions
  }

  const fetchGigantamaxForms = async (): Promise<any[]> => {
    const gigantamaxForms: any[] = []
    const gmaxVariants = [
      "charizard-gmax",
      "butterfree-gmax",
      "pikachu-gmax",
      "meowth-gmax",
      "machamp-gmax",
      "gengar-gmax",
      "kingler-gmax",
      "lapras-gmax",
      "eevee-gmax",
      "snorlax-gmax",
      "garbodor-gmax",
      "corviknight-gmax",
      "orbeetle-gmax",
      "drednaw-gmax",
      "coalossal-gmax",
      "flapple-gmax",
      "appletun-gmax",
      "sandaconda-gmax",
      "toxapex-gmax",
      "centiskorch-gmax",
      "hatterene-gmax",
      "grimmsnarl-gmax",
      "alcremie-gmax",
      "copperajah-gmax",
      "duraludon-gmax",
      "urshifu-gmax",
      "calyrex-gmax",
    ]

    setLoadingProgress(25)

    for (const variant of gmaxVariants) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variant}`)
        if (response.ok) {
          const pokemonData = await response.json()
          const speciesResponse = await fetch(pokemonData.species.url)
          if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json()
            gigantamaxForms.push({
              ...pokemonData,
              species: speciesData,
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching ${variant}:`, error)
      }
    }

    setLoadingProgress(100)
    return gigantamaxForms
  }

  const filterAndDisplayPokemon = () => {
    let filtered = [...pokemonData]

    // Apply generation filter (only for national dex)
    if (currentCategory === "national" && currentGeneration !== "all") {
      const range = generationRanges[currentGeneration as keyof typeof generationRanges]
      if (range) {
        filtered = filtered.filter((pokemon) => pokemon.id >= range.start && pokemon.id <= range.end)
      }
    }

    // Apply type filters
    if (typeFilter1 !== "all") {
      filtered = filtered.filter((pokemon) => pokemon.types.some((type: any) => type.type.name === typeFilter1))
    }

    if (typeFilter2 !== "all") {
      filtered = filtered.filter((pokemon) => pokemon.types.some((type: any) => type.type.name === typeFilter2))
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (pokemon) =>
          pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) || pokemon.id.toString().includes(searchTerm),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "height":
          return b.height - a.height
        case "weight":
          return b.weight - a.weight
        default:
          return a.id - b.id
      }
    })

    setCurrentPage(1)
    setDisplayedPokemon(filtered.slice(0, ITEMS_PER_PAGE))
    setHasMore(filtered.length > ITEMS_PER_PAGE)
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    setTimeout(() => {
      let filtered = [...pokemonData]

      if (currentCategory === "national" && currentGeneration !== "all") {
        const range = generationRanges[currentGeneration as keyof typeof generationRanges]
        if (range) {
          filtered = filtered.filter((pokemon) => pokemon.id >= range.start && pokemon.id <= range.end)
        }
      }

      if (typeFilter1 !== "all") {
        filtered = filtered.filter((pokemon) => pokemon.types.some((type: any) => type.type.name === typeFilter1))
      }

      if (typeFilter2 !== "all") {
        filtered = filtered.filter((pokemon) => pokemon.types.some((type: any) => type.type.name === typeFilter2))
      }

      if (searchTerm) {
        filtered = filtered.filter(
          (pokemon) =>
            pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) || pokemon.id.toString().includes(searchTerm),
        )
      }

      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name)
          case "height":
            return b.height - a.height
          case "weight":
            return b.weight - a.weight
          default:
            return a.id - b.id
        }
      })

      const nextPage = currentPage + 1
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newPokemon = filtered.slice(startIndex, endIndex)

      setDisplayedPokemon((prev) => [...prev, ...newPokemon])
      setCurrentPage(nextPage)
      setHasMore(endIndex < filtered.length)
      setLoadingMore(false)
    }, 500)
  }, [
    pokemonData,
    currentCategory,
    currentGeneration,
    searchTerm,
    sortBy,
    typeFilter1,
    typeFilter2,
    currentPage,
    loadingMore,
    hasMore,
  ])

  const retryLoading = () => {
    setPokemonData([])
    setDisplayedPokemon([])
    setError(null)
    if (currentCategory === "national") {
      fetchAllPokemon()
    } else {
      fetchSpecialForms()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">P</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">PokéDex</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Complete Pokémon Database</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <Navigation
          currentCategory={currentCategory}
          onCategoryChange={setCurrentCategory}
          currentGeneration={currentGeneration}
          onGenerationChange={setCurrentGeneration}
        />

        {currentCategory === "team-builder" ? (
          <TeamBuilder />
        ) : (
          <>
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              typeFilter1={typeFilter1}
              onTypeFilter1Change={setTypeFilter1}
              typeFilter2={typeFilter2}
              onTypeFilter2Change={setTypeFilter2}
            />

            {loading ? (
              <Card className="p-6 sm:p-8 text-center">
                <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                  Loading {currentCategory === "national" ? "Pokémon" : `${currentCategory} forms`}...
                </p>
                <div className="w-full max-w-md mx-auto">
                  <Progress value={loadingProgress} className="h-2" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {Math.round(loadingProgress)}% complete
                  </p>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-6 sm:p-8 text-center">
                <div className="text-4xl sm:text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Pokémon</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">{error}</p>
                <Button onClick={retryLoading} className="px-4 sm:px-6 py-2">
                  Try Again
                </Button>
              </Card>
            ) : (
              <>
                <PokemonGrid
                  pokemon={displayedPokemon}
                  onPokemonSelect={setSelectedPokemon}
                  selectedPokemon={selectedPokemon}
                />

                {hasMore && (
                  <div className="text-center mt-6 sm:mt-8">
                    <Button onClick={loadMore} disabled={loadingMore} className="px-6 sm:px-8 py-2">
                      {loadingMore ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        "Load More Pokémon"
                      )}
                    </Button>
                  </div>
                )}

                {displayedPokemon.length === 0 && !loading && !error && (
                  <Card className="p-6 sm:p-8 text-center">
                    <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Pokémon Found</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                      Try adjusting your search terms or filters
                    </p>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {selectedPokemon && <PokemonModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />}
      </div>
    </div>
  )
}
