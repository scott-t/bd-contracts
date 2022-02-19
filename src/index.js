import { getAirportsForContractGeneration } from './services/airport.service.js'
import { db } from './db.js'
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
            left join contracts on airports.identifier = contracts.dep_airport_id  AND contracts.is_available = 1
            where airports.identifier like '${iterator[i]}%'
            group by airports.identifier, airports.size, lon, lat
            having contractCount <= 8`
    )

    console.log(airports[0].length)

    const contracts = await getAirportsForContractGeneration(airports[0], allAirports)
    await db.batchInsert('contracts', contracts)
  }

  const exContracts = await db.raw(
    `SELECT  contracts.id, contracts.dep_airport_id, contracts.arr_airport_id, contracts.distance from contracts
            left join contract_cargos cc on contracts.id = cc.contract_id
            WHERE contracts.is_available = 1 AND contracts.is_completed = 0
            GROUP BY contracts.id
            HAVING COUNT(cc.id) = 0`
    )
  let countOfContracts = exContracts[0].length
  do {
    await db.raw(`CALL create_cargo()`)

    const exContracts = await db.raw(
      `SELECT  contracts.id, contracts.dep_airport_id, contracts.arr_airport_id, contracts.distance from contracts
            left join contract_cargos cc on contracts.id = cc.contract_id
            WHERE contracts.is_available = 1 AND contracts.is_completed = 0
            GROUP BY contracts.id
            HAVING COUNT(cc.id) = 0`
    )
    countOfContracts = exContracts[0].length
  }
  while (countOfContracts > 0)

  exContracts[0].length


  process.exit()
}

await run()