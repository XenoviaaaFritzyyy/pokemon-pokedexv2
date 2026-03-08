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
  const INITIAL_LOAD_SIZE = 100 // Load first 100 Pokemon (Gen 1) initially for much faster loading
  const ENABLE_BACKGROUND_LOADING = true // Load remaining Pokemon in background

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

    const createTimeoutSignal = (timeoutMs: number) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), timeoutMs)
      return controller.signal
    }

    for (let i = startId; i <= endId; i++) {
      batchPromises.push(
        fetch(`https://pokeapi.co/api/v2/pokemon/${i}`, { signal: createTimeoutSignal(5000) })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const pokemonData = await response.json()

            // Only fetch species data if not already loaded (optimization)
            let speciesData = null
            if (pokemonData.species?.url) {
              try {
                const speciesResponse = await fetch(pokemonData.species.url, { signal: createTimeoutSignal(5000) })
                if (speciesResponse.ok) {
                  speciesData = await speciesResponse.json()
                }
              } catch (error) {
                // If species fetch fails, continue without it
              }
            }

            return {
              ...pokemonData,
              species: speciesData || { id: pokemonData.id, name: pokemonData.name },
            }
          })
          .catch((error) => {
            // Silently fail - don't log every error to avoid console spam
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
      // Additional Z-A forms
      "venonat-mega",
      "venomoth-mega",
      "diglett-mega",
      "dugtrio-mega",
      "meowth-mega",
      "persian-mega",
      "psyduck-mega",
      "golduck-mega",
      "mankey-mega",
      "primeape-mega",
      "growlithe-mega",
      "arcanine-mega",
      "poliwag-mega",
      "poliwhirl-mega",
      "poliwrath-mega",
      "abra-mega",
      "kadabra-mega",
      "machop-mega",
      "machoke-mega",
      "machamp-mega",
      "bellsprout-mega",
      "weepinbell-mega",
      "victreebel-mega",
      "tentacool-mega",
      "tentacruel-mega",
      "geodude-mega",
      "graveler-mega",
      "golem-mega",
      "ponyta-mega",
      "rapidash-mega",
      "slowpoke-mega",
      "slowbro-mega",
      "magnemite-mega",
      "magneton-mega",
      "farfetchd-mega",
      "doduo-mega",
      "dodrio-mega",
      "seel-mega",
      "dewgong-mega",
      "grimer-mega",
      "muk-mega",
      "shellder-mega",
      "cloyster-mega",
      "gastly-mega",
      "haunter-mega",
      "onix-mega",
      "drowzee-mega",
      "hypno-mega",
      "krabby-mega",
      "kingler-mega",
      "voltorb-mega",
      "electrode-mega",
      "exeggcute-mega",
      "exeggutor-mega",
      "cubone-mega",
      "marowak-mega",
      "hitmonlee-mega",
      "hitmonchan-mega",
      "lickitung-mega",
      "koffing-mega",
      "weezing-mega",
      "rhyhorn-mega",
      "rhydon-mega",
      "chansey-mega",
      "tangela-mega",
      "kangaskhan-mega-z",
      "horsea-mega",
      "seadra-mega",
      "goldeen-mega",
      "seaking-mega",
      "staryu-mega",
      "starmie-mega",
      "mr-mime-mega",
      "scyther-mega",
      "jynx-mega",
      "electabuzz-mega",
      "magmar-mega",
      "tauros-mega",
      "magikarp-mega",
      "lapras-mega-z",
      "ditto-mega",
      "eevee-mega",
      "vaporeon-mega",
      "jolteon-mega",
      "flareon-mega",
      "porygon-mega",
      "omanyte-mega",
      "omastar-mega",
      "kabuto-mega",
      "kabutops-mega",
      "snorlax-mega",
      "dratini-mega",
      "dragonair-mega",
      "dragonite-mega-z",
      "mewtwo-mega-z",
      "mew-mega",
      "chikorita-mega",
      "bayleef-mega",
      "meganium-mega",
      "cyndaquil-mega",
      "quilava-mega",
      "typhlosion-mega",
      "totodile-mega",
      "croconaw-mega",
      "feraligatr-mega",
      "sentret-mega",
      "furret-mega",
      "hoothoot-mega",
      "noctowl-mega",
      "ledyba-mega",
      "ledian-mega",
      "spinarak-mega",
      "ariados-mega",
      "chinchou-mega",
      "lanturn-mega",
      "pichu-mega",
      "cleffa-mega",
      "igglybuff-mega",
      "togepi-mega",
      "togetic-mega",
      "natu-mega",
      "xatu-mega",
      "mareep-mega",
      "flaaffy-mega",
      "ampharos-mega-z",
      "bellossom-mega",
      "marill-mega",
      "azumarill-mega",
      "sudowoodo-mega",
      "politoed-mega",
      "hoppip-mega",
      "skiploom-mega",
      "jumpluff-mega",
      "aipom-mega",
      "sunkern-mega",
      "sunflora-mega",
      "yanma-mega",
      "wooper-mega",
      "quagsire-mega",
      "espeon-mega",
      "umbreon-mega",
      "murkrow-mega",
      "slowking-mega",
      "misdreavus-mega",
      "unown-mega",
      "wobbuffet-mega",
      "girafarig-mega",
      "pineco-mega",
      "forretress-mega",
      "dunsparce-mega",
      "gligar-mega",
      "steelix-mega-z",
      "snubbull-mega",
      "granbull-mega",
      "qwilfish-mega",
      "scizor-mega-z",
      "shuckle-mega",
      "heracross-mega-z",
      "sneasel-mega",
      "teddiursa-mega",
      "ursaring-mega",
      "slugma-mega",
      "magcargo-mega",
      "swinub-mega",
      "piloswine-mega",
      "corsola-mega",
      "remoraid-mega",
      "octillery-mega",
      "delibird-mega",
      "mantine-mega",
      "skarmory-mega-z",
      "houndour-mega",
      "houndoom-mega-z",
      "kingdra-mega",
      "phanpy-mega",
      "donphan-mega",
      "porygon2-mega",
      "stantler-mega",
      "smeargle-mega",
      "tyrogue-mega",
      "hitmontop-mega",
      "smoochum-mega",
      "elekid-mega",
      "magby-mega",
      "miltank-mega",
      "blissey-mega",
      "raikou-mega",
      "entei-mega",
      "suicune-mega",
      "larvitar-mega",
      "pupitar-mega",
      "tyranitar-mega-z",
      "lugia-mega",
      "ho-oh-mega",
      "celebi-mega",
      // Gen 3 Z-A Mega forms
      "treecko-mega",
      "grovyle-mega",
      "torchic-mega",
      "combusken-mega",
      "mudkip-mega",
      "marshtomp-mega",
      "poochyena-mega",
      "mightyena-mega",
      "zigzagoon-mega",
      "linoone-mega",
      "wurmple-mega",
      "silcoon-mega",
      "beautifly-mega",
      "cascoon-mega",
      "dustox-mega",
      "lotad-mega",
      "lombre-mega",
      "ludicolo-mega",
      "seedot-mega",
      "nuzleaf-mega",
      "shiftry-mega",
      "taillow-mega",
      "swellow-mega",
      "wingull-mega",
      "pelipper-mega",
      "ralts-mega",
      "kirlia-mega",
      "shroomish-mega",
      "breloom-mega",
      "slakoth-mega",
      "vigoroth-mega",
      "slaking-mega",
      "nincada-mega",
      "ninjask-mega",
      "shedinja-mega",
      "whismur-mega",
      "loudred-mega",
      "exploud-mega",
      "makuhita-mega",
      "hariyama-mega",
      "azurill-mega",
      "nosepass-mega",
      "skitty-mega",
      "delcatty-mega",
      "sableye-mega-z",
      "mawile-mega-z",
      "aron-mega",
      "lairon-mega",
      "aggron-mega-z",
      "meditite-mega",
      "medicham-mega-z",
      "electrike-mega",
      "manectric-mega-z",
      "plusle-mega",
      "minun-mega",
      "volbeat-mega",
      "illumise-mega",
      "roselia-mega",
      "gulpin-mega",
      "swalot-mega",
      "carvanha-mega",
      "sharpedo-mega-z",
      "wailmer-mega",
      "wailord-mega",
      "numel-mega",
      "camerupt-mega-z",
      "torkoal-mega",
      "spoink-mega",
      "grumpig-mega",
      "spinda-mega",
      "trapinch-mega",
      "vibrava-mega",
      "flygon-mega",
      "cacnea-mega",
      "cacturne-mega",
      "swablu-mega",
      "altaria-mega-z",
      "zangoose-mega",
      "seviper-mega",
      "lunatone-mega",
      "solrock-mega",
      "barboach-mega",
      "whiscash-mega",
      "corphish-mega",
      "crawdaunt-mega",
      "baltoy-mega",
      "claydol-mega",
      "lileep-mega",
      "cradily-mega",
      "anorith-mega",
      "armaldo-mega",
      "feebas-mega",
      "milotic-mega",
      "castform-mega",
      "kecleon-mega",
      "shuppet-mega",
      "banette-mega-z",
      "duskull-mega",
      "dusclops-mega",
      "tropius-mega",
      "chimecho-mega-z",
      "absol-mega-z",
      "wynaut-mega",
      "snorunt-mega",
      "glalie-mega-z",
      "spheal-mega",
      "sealeo-mega",
      "walrein-mega",
      "clamperl-mega",
      "huntail-mega",
      "gorebyss-mega",
      "relicanth-mega",
      "luvdisc-mega",
      "bagon-mega",
      "shelgon-mega",
      "salamence-mega-z",
      "beldum-mega",
      "metang-mega",
      "metagross-mega-z",
      "regirock-mega",
      "regice-mega",
      "registeel-mega",
      "latias-mega-z",
      "latios-mega-z",
      "kyogre-mega-z",
      "groudon-mega-z",
      "rayquaza-mega-z",
      "jirachi-mega",
      "deoxys-mega",
      // Gen 4 Z-A Mega forms  
      "turtwig-mega",
      "grotle-mega",
      "torterra-mega",
      "chimchar-mega",
      "monferno-mega",
      "infernape-mega",
      "piplup-mega",
      "prinplup-mega",
      "empoleon-mega",
      "starly-mega",
      "staravia-mega",
      "staraptor-mega-z",
      "bidoof-mega",
      "bibarel-mega",
      "kricketot-mega",
      "kricketune-mega",
      "shinx-mega",
      "luxio-mega",
      "luxray-mega",
      "budew-mega",
      "roserade-mega",
      "cranidos-mega",
      "rampardos-mega",
      "shieldon-mega",
      "bastiodon-mega",
      "burmy-mega",
      "wormadam-mega",
      "mothim-mega",
      "combee-mega",
      "vespiquen-mega",
      "pachirisu-mega",
      "buizel-mega",
      "floatzel-mega",
      "cherubi-mega",
      "cherrim-mega",
      "shellos-mega",
      "gastrodon-mega",
      "ambipom-mega",
      "drifloon-mega",
      "drifblim-mega",
      "buneary-mega",
      "lopunny-mega-z",
      "mismagius-mega",
      "honchkrow-mega",
      "glameow-mega",
      "purugly-mega",
      "chingling-mega",
      "stunky-mega",
      "skuntank-mega",
      "bronzor-mega",
      "bronzong-mega",
      "bonsly-mega",
      "mime-jr-mega",
      "happiny-mega",
      "chatot-mega",
      "spiritomb-mega",
      "gible-mega",
      "gabite-mega",
      "garchomp-mega-z",
      "munchlax-mega",
      "snorlax-mega-z",
      "phione-mega",
      "manaphy-mega",
      "rotom-mega",
      "uxie-mega",
      "mesprit-mega",
      "azelf-mega",
      "dialga-mega",
      "palkia-mega",
      "heatran-mega-z",
      "regigigas-mega",
      "giratina-mega",
      "cresselia-mega",
      "phione-mega",
      "manaphy-mega",
      "darkrai-mega-z",
      "shaymin-mega",
      "arceus-mega",
      // Gen 5 Z-A Mega forms
      "snivy-mega",
      "servine-mega",
      "serperior-mega",
      "tepig-mega",
      "pignite-mega",
      "emboar-mega-z",
      "oshawott-mega",
      "dewott-mega",
      "samurott-mega",
      "patrat-mega",
      "watchog-mega",
      "lillipup-mega",
      "herdier-mega",
      "stoutland-mega",
      "pidove-mega",
      "tranquill-mega",
      "unfezant-mega",
      "blitzle-mega",
      "zebstrika-mega",
      "woobat-mega",
      "swoobat-mega",
      "drilbur-mega",
      "excadrill-mega-z",
      "audino-mega-z",
      "timburr-mega",
      "gurdurr-mega",
      "conkeldurr-mega",
      "tympole-mega",
      "palpitoad-mega",
      "seismitoad-mega",
      "throh-mega",
      "sawk-mega",
      "sewaddle-mega",
      "swadloon-mega",
      "leavanny-mega",
      "venipede-mega",
      "whirlipede-mega",
      "scolipede-mega-z",
      "cottonee-mega",
      "whimiscott-mega",
      "petilil-mega",
      "lilligant-mega",
      "basculin-mega",
      "sandile-mega",
      "krokorok-mega",
      "krookodile-mega",
      "darumaka-mega",
      "darmanitan-mega",
      "maractus-mega",
      "dwebble-mega",
      "crustle-mega",
      "scraggy-mega",
      "scrafty-mega-z",
      "sigilyph-mega",
      "yamask-mega",
      "cofagrigus-mega",
      "tirtouga-mega",
      "carracosta-mega",
      "archen-mega",
      "archeops-mega",
      "trubbish-mega",
      "garbodor-mega",
      "zorua-mega",
      "zoroark-mega",
      "minccino-mega",
      "cinccino-mega",
      "gothita-mega",
      "gothorita-mega",
      "gothitelle-mega",
      "solosis-mega",
      "duosion-mega",
      "reuniclus-mega",
      "ducklett-mega",
      "swanna-mega",
      "vanillite-mega",
      "vanilish-mega",
      "vanilluxe-mega",
      "deerling-mega",
      "sawsbuck-mega",
      "emolga-mega",
      "joltik-mega",
      "galvantula-mega",
      "ferroseed-mega",
      "ferrothorn-mega",
      "klink-mega",
      "klang-mega",
      "klinklang-mega",
      "eelektrik-mega",
      "eelektross-mega-z",
      "elgyem-mega",
      "beheeyem-mega",
      "litwick-mega",
      "lampent-mega",
      "chandelure-mega-z",
      "axew-mega",
      "fraxure-mega",
      "haxorus-mega",
      "cubchoo-mega",
      "beartic-mega",
      "cryogonal-mega",
      "shelmet-mega",
      "accelgor-mega",
      "stunfisk-mega",
      "mienfoo-mega",
      "mienshao-mega",
      "druddigon-mega",
      "golett-mega",
      "golurk-mega-z",
      "pawniard-mega",
      "bisharp-mega",
      "bouffalant-mega",
      "rufflet-mega",
      "braviary-mega",
      "vullaby-mega",
      "mandibuzz-mega",
      "heatmor-mega",
      "durant-mega",
      "deino-mega",
      "zweilous-mega",
      "hydreigon-mega",
      "larvesta-mega",
      "volcarona-mega",
      "cobalion-mega",
      "terrakion-mega",
      "virizion-mega",
      "tornadus-mega",
      "thundurus-mega",
      "landorus-mega",
      "kyurem-mega",
      "keldeo-mega",
      "meloetta-mega",
      "genesect-mega",
      // Gen 6 Z-A Mega forms
      "chespin-mega",
      "quilladin-mega",
      "chesnaught-mega-z",
      "fennekin-mega",
      "braixen-mega",
      "delphox-mega-z",
      "froakie-mega",
      "frogadier-mega",
      "greninja-mega-z",
      "bunnelby-mega",
      "diggersby-mega",
      "fletchling-mega",
      "fletchinder-mega",
      "talonflame-mega",
      "scatterbug-mega",
      "spewpa-mega",
      "vivillon-mega",
      "litleo-mega",
      "pyroar-mega-z",
      "flabebe-mega",
      "floette-mega-z",
      "florges-mega",
      "skiddo-mega",
      "gogoat-mega",
      "pancham-mega",
      "pangoro-mega",
      "furfrou-mega",
      "espurr-mega",
      "meowstic-mega-z",
      "honedge-mega",
      "doublade-mega",
      "aegislash-mega",
      "spritzee-mega",
      "aromatisse-mega",
      "swirlix-mega",
      "slurpuff-mega",
      "inkay-mega",
      "malamar-mega-z",
      "helioptile-mega",
      "heliolisk-mega",
      "tyrunt-mega",
      "tyrantrum-mega",
      "amaura-mega",
      "aurorus-mega",
      "sylveon-mega",
      "hawlucha-mega-z",
      "goomy-mega",
      "sliggoo-mega",
      "goodra-mega",
      "jangmo-o-mega",
      "hakamo-o-mega",
      "kommo-o-mega",
      "clauncher-mega",
      "clawitzer-mega",
      "phantump-mega",
      "trevenant-mega",
      "pumpkaboo-mega",
      "gourgeist-mega",
      "bergmite-mega",
      "avalugg-mega",
      "noibat-mega",
      "noivern-mega",
      "xerneas-mega",
      "yveltal-mega",
      "zygarde-mega-z",
      "diancie-mega-z",
      "hoopa-mega",
      "volcanion-mega",
      // Gen 7 Z-A Mega forms
      "rowlet-mega",
      "dartrix-mega",
      "decidueye-mega",
      "litten-mega",
      "torracat-mega",
      "incineroar-mega",
      "popplio-mega",
      "brionne-mega",
      "primarina-mega",
      "pikipek-mega",
      "trumbeak-mega",
      "toucannon-mega",
      "yungoos-mega",
      "gumshoos-mega",
      "grubbin-mega",
      "charjabug-mega",
      "vikavolt-mega",
      "crabrawler-mega",
      "crabominable-mega-z",
      "oricorio-mega",
      "cutiefly-mega",
      "ribombee-mega",
      "rockruff-mega",
      "lycanroc-mega",
      "wishiwashi-mega",
      "mareanie-mega",
      "toxapex-mega",
      "mudbray-mega",
      "mudsdale-mega",
      "dewpider-mega",
      "araquanid-mega",
      "fomantis-mega",
      "lurantis-mega",
      "morelull-mega",
      "shiinotic-mega",
      "salandit-mega",
      "salazzle-mega",
      "stufful-mega",
      "bewear-mega",
      "bounsweet-mega",
      "steenee-mega",
      "tsareena-mega",
      "comfey-mega",
      "oranguru-mega",
      "passimian-mega",
      "wimpod-mega",
      "golisopod-mega-z",
      "sandygast-mega",
      "palossand-mega",
      "pyukumuku-mega",
      "type-null-mega",
      "silvally-mega",
      "minior-mega",
      "komala-mega",
      "togedemaru-mega",
      "mimikyu-mega",
      "bruxish-mega",
      "drampa-mega-z",
      "dhelmise-mega",
      "jangmo-o-mega",
      "hakamo-o-mega",
      "kommo-o-mega",
      "tapu-koko-mega",
      "tapu-lele-mega",
      "tapu-bulu-mega",
      "tapu-fini-mega",
      "cosmog-mega",
      "cosmoem-mega",
      "solgaleo-mega",
      "lunala-mega",
      "nihilego-mega",
      "buzzwole-mega",
      "pheromosa-mega",
      "xurkitree-mega",
      "celesteela-mega",
      "kartana-mega",
      "guzzlord-mega",
      "necrozma-mega",
      "magearna-mega-z",
      "marshadow-mega",
      "zeraora-mega-z",
      "meltan-mega",
      "melmetal-mega",
      // Gen 8 Z-A Mega forms
      "grookey-mega",
      "thwackey-mega",
      "rillaboom-mega",
      "scorbunny-mega",
      "raboot-mega",
      "cinderace-mega",
      "sobble-mega",
      "drizzile-mega",
      "inteleon-mega",
      "skwovet-mega",
      "greedent-mega",
      "rookidee-mega",
      "corvisquire-mega",
      "corviknight-mega",
      "blipbug-mega",
      "dottler-mega",
      "orbeetle-mega",
      "nickit-mega",
      "thievul-mega",
      "gossifleur-mega",
      "eldegoss-mega",
      "wooloo-mega",
      "dubwool-mega",
      "chewtle-mega",
      "drednaw-mega",
      "yamper-mega",
      "boltund-mega",
      "rolycoly-mega",
      "carkol-mega",
      "coalossal-mega",
      "applin-mega",
      "flapple-mega",
      "appletun-mega",
      "silicobra-mega",
      "sandaconda-mega",
      "cramorant-mega",
      "arrokuda-mega",
      "barraskewda-mega",
      "toxel-mega",
      "toxtricity-mega",
      "sizzlipede-mega",
      "centiskorch-mega",
      "clobbopus-mega",
      "grapploct-mega",
      "sinistea-mega",
      "polteageist-mega",
      "hatenna-mega",
      "hattrem-mega",
      "hatterene-mega",
      "impidimp-mega",
      "morgrem-mega",
      "grimmsnarl-mega",
      "obstagoon-mega",
      "perrserker-mega",
      "cursola-mega",
      "sirfetchd-mega",
      "mr-rime-mega",
      "runerigus-mega",
      "milcery-mega",
      "alcremie-mega",
      "falinks-mega-z",
      "pincurchin-mega",
      "snom-mega",
      "frosmoth-mega",
      "stonjourner-mega",
      "eiscue-mega",
      "indeedee-mega",
      "morpeko-mega",
      "cufant-mega",
      "copperajah-mega",
      "dracozolt-mega",
      "arctozolt-mega",
      "dracovish-mega",
      "arctovish-mega",
      "duraludon-mega",
      "dreepy-mega",
      "drakloak-mega",
      "dragapult-mega",
      "zacian-mega",
      "zamazenta-mega",
      "eternatus-mega",
      "kubfu-mega",
      "urshifu-mega",
      "regieleki-mega",
      "regidrago-mega",
      "glastrier-mega",
      "spectrier-mega",
      "calyrex-mega",
      // Gen 9 Z-A Mega forms
      "sprigatito-mega",
      "floragato-mega",
      "meowscarada-mega",
      "fuecoco-mega",
      "crocalor-mega",
      "skeledirge-mega",
      "quaxly-mega",
      "quaxwell-mega",
      "quaquaval-mega",
      "lechonk-mega",
      "oinkologne-mega",
      "tarountula-mega",
      "spidops-mega",
      "nymble-mega",
      "lokix-mega",
      "pawmi-mega",
      "pawmo-mega",
      "pawmot-mega",
      "tandemaus-mega",
      "maushold-mega",
      "fidough-mega",
      "dachsbun-mega",
      "smoliv-mega",
      "dolliv-mega",
      "arboliva-mega",
      "squawkabilly-mega",
      "nacli-mega",
      "naclstack-mega",
      "garganacl-mega",
      "charcadet-mega",
      "armarouge-mega",
      "ceruledge-mega",
      "tadbulb-mega",
      "bellibolt-mega",
      "wattrel-mega",
      "kilowattrel-mega",
      "maschiff-mega",
      "mabosstiff-mega",
      "shroodle-mega",
      "grafaiai-mega",
      "bramblin-mega",
      "brambleghast-mega",
      "toedscool-mega",
      "toedscruel-mega",
      "klawf-mega",
      "capsakid-mega",
      "scovillain-mega-z",
      "rellor-mega",
      "rabsca-mega",
      "flittle-mega",
      "espathra-mega",
      "tinkatink-mega",
      "tinkaton-mega",
      "wiglett-mega",
      "wugtrio-mega",
      "bombirdier-mega",
      "finizen-mega",
      "palafin-mega",
      "varoom-mega",
      "revavroom-mega",
      "cyclizar-mega",
      "orthworm-mega",
      "glimmet-mega",
      "glimmora-mega-z",
      "greavard-mega",
      "houndstone-mega",
      "flamigo-mega",
      "cetoddle-mega",
      "cetitan-mega",
      "veluza-mega",
      "dondozo-mega",
      "tatsugiri-mega-z",
      "annihilape-mega",
      "clodsire-mega",
      "farigiraf-mega",
      "dudunsparce-mega",
      "kingambit-mega",
      "great-tusk-mega",
      "scream-tail-mega",
      "brute-bonnet-mega",
      "flutter-mane-mega",
      "slither-wing-mega",
      "sandy-shocks-mega",
      "iron-treads-mega",
      "iron-bundle-mega",
      "iron-hands-mega",
      "iron-jugulis-mega",
      "iron-moth-mega",
      "iron-thorns-mega",
      "frigibax-mega",
      "arctibax-mega",
      "baxcalibur-mega-z",
      "gimmighoul-mega",
      "gholdengo-mega",
      "wo-chien-mega",
      "chien-pao-mega",
      "ting-lu-mega",
      "chi-yu-mega",
      "roaring-moon-mega",
      "iron-valiant-mega",
      "koraidon-mega",
      "miraidon-mega",
      "walking-wake-mega",
      "iron-leaves-mega",
      "dipplin-mega",
      "poltchageist-mega",
      "sinistcha-mega",
      "okidogi-mega",
      "munkidori-mega",
      "fezandipiti-mega",
      "ogerpon-mega-z",
      "archaludon-mega",
      "hydrapple-mega",
      "gouging-fire-mega",
      "raging-bolt-mega",
      "iron-boulder-mega",
      "iron-crown-mega",
      "terapagos-mega",
      "pecharunt-mega",
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
          <TeamBuilder currentGeneration={currentGeneration} />
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
                      ? `Loading Generation I Pokémon...`
                      : loadingProgress < 100
                        ? `Loading remaining Pokémon in background...`
                        : `Finalizing data...`}
                  </p>
                  <div className="w-full max-w-md mx-auto">
                    <Progress value={loadingProgress} className="h-3 rounded-full" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {Math.round(loadingProgress)}% complete
                      {displayedPokemon.length > 0 && ` • Loaded ${displayedPokemon.length} Pokémon`}
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
