import { db } from '../db.js'
import { polygon, point, distance, booleanContains, circle } from '@turf/turf'
import { generateContractDetails } from './contract.service.js'
import { PERC_LONG, PERC_MEDIUM, PERC_SHORT } from '../constants.js'
import { createPolygon } from './geo.service.js'
import { getRandom } from './helper.service.js'

export const getAirportsForContractGeneration = async (airports, allAirports) => {

  let contracts = []
  // loop through each airport and process
  for (let i = 0; i < airports.length; i++) {
    //get the current number of contracts

    // determine the max number of jobs based on airport size
    let maxJobs = 0
    switch (airports[i].size) {
      case 0:
      case 1:
        maxJobs = 10
        break
      case 2:
      case 3:
        maxJobs = 18
        break
      case 4:
      case 5:
        maxJobs = 25
        break
    }
    if (airports[i].contractCount < maxJobs) {
      const numberToGen = maxJobs - airports[i].contractCount
      const shortQty = (numberToGen / 100) * PERC_SHORT
      const medQty = (numberToGen / 100) * PERC_MEDIUM
      const longQty = (numberToGen / 100) * PERC_LONG

      // create polygons
      // const polyShort = await createPolygon(airports[i].lat, airports[i].lon, 50)
      // const polyMed = await createPolygon(airports[i].lat, airports[i].lon, 150)
      // const polyLong = await createPolygon(airports[i].lat, airports[i].lon, 250)

      const centre = [airports[i].lon, airports[i].lat]
      const polyShort = circle(centre, 50, { steps: 16, units: 'nauticalmiles' })
      const polyMed = circle(centre, 150, { steps: 16, units: 'nauticalmiles' })
      const polyLong = circle(centre, 250, { steps: 16, units: 'nauticalmiles' })

      const selectedAirports = await getAirportsForEachRange(allAirports, airports[i], polyShort, polyMed, polyLong)

      let shortContracts = []
      let medContracts = []
      let longContracts = []
      // pick random airports from selected airports for each range based on above qtys
      if (selectedAirports.short.length <= shortQty && selectedAirports.short.length > 0) {
        // generate contracts
        shortContracts = await generateContractDetails(airports[i], selectedAirports.short)
      } else if (selectedAirports.short.length > 0) {
        // select random n airports
        const randomAirports = await getRandom(selectedAirports.short, shortQty)
        shortContracts = await generateContractDetails(airports[i], randomAirports)
      }

      if (selectedAirports.med.length <= medQty && selectedAirports.med.length > 0) {
        // generate contracts
        medContracts = await generateContractDetails(airports[i], selectedAirports.med)
      } else if (selectedAirports.med.length > 0) {
        // select random n airports
        const randomAirports = await getRandom(selectedAirports.med, medQty)
        medContracts = await generateContractDetails(airports[i], randomAirports)
      }

      if (selectedAirports.long.length <= longQty && selectedAirports.long.length > 0) {
        // generate contracts
        longContracts = await generateContractDetails(airports[i], selectedAirports.long)
      } else if (selectedAirports.long.length > 0) {
        // select random n airports
        const randomAirports = await getRandom(selectedAirports.med, longQty)
        longContracts = await generateContractDetails(airports[i], randomAirports)
      }

      // store contracts in array
      const c = [...shortContracts, ...medContracts, ...longContracts]

      // push contracts into array - TODO: probably needs to change
      contracts = [...contracts, ...c]
      // console.log(contracts)
    }
  }
  return contracts
}

const getAirportsForEachRange = async (airports, airport, short, med, long) => {

  let shortAirports = []
  let medAirports = []
  let longAirports = []

  for (let i = 0; i < airports.length; i++) {
    const originPoint = point([airport.lon, airport.lat])
    const destPoint = point([airports[i].lon, airports[i].lat])
    if (booleanContains(short, destPoint)
      && distance(originPoint, destPoint, { units: 'nauticalmiles' }) <= 50) {
      // console.log(airports[i].identifier)
      shortAirports.push(airports[i])
    }
    if (booleanContains(med, destPoint)
      && distance(originPoint, destPoint, { units: 'nauticalmiles' }) > 50
      && distance(originPoint, destPoint, { units: 'nauticalmiles' }) <= 150) {
      medAirports.push(airports[i])
    }
    if (booleanContains(long, destPoint)
      && distance(originPoint, destPoint, { units: 'nauticalmiles' }) > 150
      && distance(originPoint, destPoint, { units: 'nauticalmiles' }) <= 300) {
      longAirports.push(airports[i])
    }
  }

  return { short: shortAirports, med: medAirports, long: longAirports }
}