import { getAirportsForContractGeneration } from './services/airport.service.js'
import { db } from './db.js'
import { generateCargo } from './services/contract.service.js'
async function run () {

  // specify alphabet and nums array to split the generation
  const alpha = Array.from(Array(26)).map((e, i) => i + 65)
  const alphabet = alpha.map((x) => String.fromCharCode(x))
  const nums = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  // join alpha and nums into one array
  const iterator = [...alphabet, ...nums]
  const allAirports = await db('airports')
    .select('airports.identifier', 'airports.size', 'airports.lon', 'airports.lat')

  console.log(allAirports.length)

  // batch contracts to airport
  for (let i = 0; i < iterator.length; i++) {
    const airports = await db.raw(
      `select airports.identifier, airports.size, airports.lon, airports.lat, COUNT(contracts.id) as contractCount
            from airports
            left join contracts on airports.identifier = contracts.dep_airport_id  AND contracts.is_available = 0
            where airports.identifier like '${iterator[i]}%'
            group by airports.identifier, airports.size, lon, lat
            having contractCount <= 10`
    )

    console.log(airports[0].length)

    const contracts = await getAirportsForContractGeneration(airports[0], allAirports)
    await db.batchInsert('contracts', contracts)
  }
  //
  // find contracts without cargo TODO: update this to use the alphabet iteration too
  for (let i = 0; i < iterator.length; i++) {
    const exContracts = await db('contracts')
      .leftJoin('contract_cargos', 'contracts.id', '=', 'contract_cargos.contract_id')
      .select('contracts.*', db.raw('COUNT(contract_cargos.id) as cargo'))
      .whereLike('contracts.dep_airport_id', `${iterator[i]}%`)
      .groupBy('contracts.id')
      .havingRaw('COUNT(contract_cargos.id) = ?', [0])

    console.log(exContracts.length)

    let cargo = []
    for (let i = 0; i < exContracts.length; i++) {
      // create cargo for each
      const cc = await generateCargo(exContracts[i])
      cargo.push(cc)
    }
    // insert into db
    await db.batchInsert('contract_cargos', cargo)
  }


  process.exit()
}

await run()