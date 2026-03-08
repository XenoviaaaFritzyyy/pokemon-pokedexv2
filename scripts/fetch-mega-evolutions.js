import fs from 'fs';

// List of known mega evolution names to check in PokeAPI
const knownMegaEvolutions = [
  // Gen 6 (Original Megas)
  'venusaur-mega',
  'charizard-mega-x',
  'charizard-mega-y',
  'blastoise-mega',
  'alakazam-mega',
  'gengar-mega',
  'kangaskhan-mega',
  'pinsir-mega',
  'gyarados-mega',
  'aerodactyl-mega',
  'mewtwo-mega-x',
  'mewtwo-mega-y',
  
  // Gen 7 (Sun/Moon Megas)
  'ampharos-mega',
  'scizor-mega',
  'heracross-mega',
  'houndoom-mega',
  'tyranitar-mega',
  'blaziken-mega',
  'gardevoir-mega',
  'mawile-mega',
  'aggron-mega',
  'medicham-mega',
  'manectric-mega',
  'banette-mega',
  'absol-mega',
  'latios-mega',
  'latias-mega',
  'garchomp-mega',
  'lucario-mega',
  'abomasnow-mega',
  
  // Gen 7 (Ultra Sun/Moon Megas)
  'beedrill-mega',
  'pidgeot-mega',
  'slowbro-mega',
  'steelix-mega',
  'sceptile-mega',
  'swampert-mega',
  'camerupt-mega',
  'altaria-mega',
  'glalie-mega',
  'salamence-mega',
  'metagross-mega',
  'rayquaza-mega',
  'lopunny-mega',
  'gallade-mega',
  'audino-mega',
  'sharpedo-mega',
  
  // Gen 8 (Sword/Shield)
  'diancie-mega',
  
  // Primal Reversions
  'kyogre-primal',
  'groudon-primal',
];

async function fetchMegaEvolutions() {
  const megaEvolutions = [];
  let successCount = 0;
  let failureCount = 0;
  const failedNames = [];

  console.log(`Fetching ${knownMegaEvolutions.length} mega evolution variants from PokeAPI...`);

  for (const megaName of knownMegaEvolutions) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${megaName}`);
      
      if (!response.ok) {
        failedNames.push(megaName);
        failureCount++;
        continue;
      }

      const pokemonData = await response.json();
      
      // Fetch species data for additional info
      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();

      const megaData = {
        id: pokemonData.id,
        name: pokemonData.name,
        baseName: speciesData.name,
        height: pokemonData.height,
        weight: pokemonData.weight,
        sprites: {
          front_default: pokemonData.sprites.front_default,
          front_shiny: pokemonData.sprites.front_shiny,
          back_default: pokemonData.sprites.back_default,
          back_shiny: pokemonData.sprites.back_shiny,
        },
        stats: pokemonData.stats.map(stat => ({
          name: stat.stat.name,
          baseStat: stat.base_stat,
        })),
        types: pokemonData.types.map(type => type.type.name),
        abilities: pokemonData.abilities.map(ability => ({
          name: ability.ability.name,
          isHidden: ability.is_hidden,
        })),
      };

      megaEvolutions.push(megaData);
      successCount++;
      console.log(`✓ ${megaName}`);
    } catch (error) {
      failedNames.push(megaName);
      failureCount++;
      console.log(`✗ ${megaName} - ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n=== Mega Evolution Fetch Results ===`);
  console.log(`Total Attempted: ${knownMegaEvolutions.length}`);
  console.log(`Successfully Fetched: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  
  if (failedNames.length > 0) {
    console.log(`\nFailed to fetch:`);
    failedNames.forEach(name => console.log(`  - ${name}`));
  }

  // Save results to file
  const output = {
    totalFetched: successCount,
    totalFailed: failureCount,
    fetchedAt: new Date().toISOString(),
    megaEvolutions: megaEvolutions.sort((a, b) => a.id - b.id),
  };

  fs.writeFileSync('/tmp/mega-evolutions.json', JSON.stringify(output, null, 2));
  console.log(`\nResults saved to /tmp/mega-evolutions.json`);
  console.log(`\n=== Available Mega Evolutions ===`);
  console.log(JSON.stringify(megaEvolutions.sort((a, b) => a.id - b.id), null, 2));
}

fetchMegaEvolutions().catch(console.error);
