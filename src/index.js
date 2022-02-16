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

  // batch contracts to airport
  // for (let i = 0; i < iterator.length; i++) {
  //   const airports = await db('airports')
  //     .leftJoin('contracts', 'airports.identifier', '=', 'contracts.dep_airport_id')
  //     .select('airports.*', db.raw('COUNT(contracts.id) as contracts'))
  //     .whereLike('airports.identifier', `${iterator[i]}%`)
  //     .where('contracts.expires_at', '>', new Date())
  //     .groupBy('airports.identifier')
  //
  //   const contracts = await getAirportsForContractGeneration(airports)
  //   await db.batchInsert('contracts', contracts)
  // }
  //
  // find contracts without cargo
  const exContracts = await db('contracts')
    .leftJoin('contract_cargos', 'contracts.id', '=', 'contract_cargos.contract_id')
    .select('contracts.*', db.raw('COUNT(contract_cargos.id) as cargo'))
    .groupBy('contracts.id')
    .havingRaw('COUNT(contract_cargos.id) = ?', [0])


  let cargo = []
  for (let i = 0; i < exContracts.length; i++) {
    // create cargo for each
    const cc = await generateCargo(exContracts[i])
    cargo.push(cc)
  }
  // insert into db
  await db.batchInsert('contract_cargos', cargo)

  process.exit()
}

await run()