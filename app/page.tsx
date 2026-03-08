"use client"

import { useState, useEffect, useCallback } from "react"
import { PokemonGrid } from "@/components/pokemon-grid"
import { PokemonModal } from "@/components/pokemon-modal"
import { Navigation } from "@/components/navigation"
import { FilterBar } from "@/components/filter-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { TeamBuilder } from "@/components/team-builder"
import { PokemonGridSkeleton } from "@/components/pokemon-grid-skeleton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { GENERATION_RANGES, filterPokemonByGeneration } from "@/lib/utils"

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
  const INITIAL_LOAD_SIZE = 150 // Only load first 150 Pokemon initially for faster loading

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
    const batchPromises = []

    for (let i = startId; i <= endId; i++) {
      batchPromises.push(
        fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
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
            console.error(`Error fetching Pokémon ${i}:`, error)
            return null
          }),
      )
    }

    const results = await Promise.all(batchPromises)
    return results.filter(Boolean)
  }

  const fetchAllPokemon = async () => {
    setLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      // Check localStorage for cached Pokemon data
      const cachedData = localStorage.getItem("pokemonDataCache")
      const cacheTimestamp = localStorage.getItem("pokemonDataCacheTime")
      const cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours

      if (
        cachedData &&
        cacheTimestamp &&
        Date.now() - parseInt(cacheTimestamp) < cacheExpiry
      ) {
        console.log("[v0] Loading Pokemon from cache")
        const allPokemon = JSON.parse(cachedData)
        setPokemonData(allPokemon)
        setLoadingProgress(100)
        setLoading(false)
        return
      }

      const allPokemon: any[] = []
      // Load initial batch (first 150 Pokemon) for faster initial load
      const initialBatchData = await fetchPokemonBatch(1, INITIAL_LOAD_SIZE)
      allPokemon.push(...initialBatchData)
      setLoadingProgress(25)

      // Display initial Pokemon while loading the rest in background
      setPokemonData(allPokemon)

      // Continue loading remaining Pokemon
      const remainingBatches = Math.ceil(
        (1025 - INITIAL_LOAD_SIZE) / BATCH_SIZE,
      )

      for (let batch = 0; batch < remainingBatches; batch++) {
        const startId = INITIAL_LOAD_SIZE + batch * BATCH_SIZE + 1
        const endId = Math.min(
          INITIAL_LOAD_SIZE + (batch + 1) * BATCH_SIZE,
          1025,
        )

        try {
          const batchData = await fetchPokemonBatch(startId, endId)
          allPokemon.push(...batchData)

          const progress = 25 + ((batch + 1) / remainingBatches) * 75
          setLoadingProgress(progress)

          // Stagger requests to avoid rate limiting
          if (batch < remainingBatches - 1) {
            await delay(100)
          }
        } catch (error) {
          console.error(`Error fetching batch ${batch + 1}:`, error)
        }
      }

      allPokemon.sort((a, b) => a.id - b.id)
      setPokemonData(allPokemon)

      // Cache the data
      localStorage.setItem("pokemonDataCache", JSON.stringify(allPokemon))
      localStorage.setItem(
        "pokemonDataCacheTime",
        Date.now().toString(),
      )

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
      // Original Mega Evolutions (Gen 6)
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
      // New Mega Evolutions from Legends: Z-A
      "bulbasaur-mega",
      "ivysaur-mega",
      "charmander-mega",
      "charmeleon-mega",
      "squirtle-mega",
      "wartortle-mega",
      "caterpie-mega",
      "metapod-mega",
      "weedle-mega",
      "kakuna-mega",
      "pidgey-mega",
      "pidgeotto-mega",
      "rattata-mega",
      "raticate-mega",
      "spearow-mega",
      "fearow-mega",
      "ekans-mega",
      "arbok-mega",
      "pikachu-mega",
      "raichu-mega",
      "sandshrew-mega",
      "nidoran-f-mega",
      "nidorina-mega",
      "nidoqueen-mega",
      "nidoran-m-mega",
      "nidorino-mega",
      "nidoking-mega",
      "clefairy-mega",
      "clefable-mega",
      "vulpix-mega",
      "ninetales-mega",
      "jigglypuff-mega",
      "wigglytuff-mega",
      "zubat-mega",
      "golbat-mega",
      "crobat-mega",
      "oddish-mega",
      "gloom-mega",
      "vileplume-mega",
      "paras-mega",
      "parasect-mega",
    ]

    setLoadingProgress(25)

    for (const variant of megaVariants) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variant}`)
        if (response.ok) {
          const pokemonData = await response.json()
          const speciesResponse = await fetch(pokemonData.species.url)
          if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json()
            megaEvolutions.push({
              ...pokemonData,
              species: speciesData,
            })
          }
        }
      } catch (error) {
        // console.error removed to avoid cluttering console
      }
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
      filtered = filterPokemonByGeneration(filtered, currentGeneration)
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
        filtered = filterPokemonByGeneration(filtered, currentGeneration)
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
              <>
                <Card className="p-6 sm:p-8 mb-6 text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-0">
                  <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium text-sm sm:text-base">
                    {loadingProgress < 25
                      ? `Loading initial Pokémon batch...`
                      : `Loading remaining Pokémon...`}
                  </p>
                  <div className="w-full max-w-md mx-auto">
                    <Progress value={loadingProgress} className="h-3 rounded-full" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {Math.round(loadingProgress)}% complete
                    </p>
                  </div>
                </Card>
                {displayedPokemon.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Showing {displayedPokemon.length} of ~1025 Pokémon
                    </p>
                    <PokemonGrid
                      pokemon={displayedPokemon}
                      onPokemonSelect={setSelectedPokemon}
                      selectedPokemon={selectedPokemon}
                    />
                    <div className="mt-6 opacity-50">
                      <PokemonGridSkeleton count={8} />
                    </div>
                  </>
                )}
                {displayedPokemon.length === 0 && (
                  <PokemonGridSkeleton count={20} />
                )}
              </>
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
