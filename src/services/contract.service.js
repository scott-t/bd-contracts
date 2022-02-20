import { db } from '../db.js'
import { getBearingBetweenPoints, getDistanceBetweenPoints } from './geo.service.js'
import { CARGO_MULTI, DISTANCE_MULTI, PAX_MULTI } from '../constants.js'
import { generateRandomNumber } from './helper.service.js'

export async function generateContractDetails(origin, airports) {
  const contracts = []
  for (let i = 0; i < airports.length; i++) {
    if (origin.identifier !== airports[i].identifier) {

      // get distance and bearing
      const distance = await getDistanceBetweenPoints(origin.lat, origin.lon, airports[i].lat, airports[i].lon)
      const heading = await getBearingBetweenPoints(origin.lat, origin.lon, airports[i].lat, airports[i].lon)

      let expiry = new Date()
      const days = Math.floor(Math.random() * 8) + 1
      expiry.setDate(expiry.getDate() + days)

      contracts.push({
        dep_airport_id: origin.identifier,
        arr_airport_id: airports[i].identifier,
        distance,
        heading,
        expires_at: expiry,
        contract_value: 0.00,
        created_at: new Date(),
        updated_at: new Date()
      })
    }
  }
  return contracts
}

export async function generateCargo(contract) {
  const types = await db.select().table("cargo_types")
  const random = Math.floor(Math.random() * types.length)
  const cargo = types[random]
  let qty = 0
  if (cargo.type === 1) {
    qty = await generateRandomNumber(100, 10000)
  } else {
    qty = await generateRandomNumber(1, 15)
  }

  const value = await calcContractValue(cargo.type, qty, contract.distance)

  return {
    cargo: cargo.text,
    contract_type_id: cargo.type,
    cargo_qty: qty,
    contract_value: value,
    contract_id: contract.id,
    dep_airport_id: contract.dep_airport_id,
    arr_airport_id: contract.arr_airport_id,
    current_airport_id: contract.dep_airport_id,
    created_at: new Date(),
    updated_at: new Date()
  }
}

const calcContractValue = async (type, cargo, distance) => {
  const distanceValue = (distance / 50) * DISTANCE_MULTI
  if (type === 1) {
    const cargoValue = cargo * CARGO_MULTI
    return Math.round(cargoValue + distanceValue)
  } else {
    const cargoValue = cargo * PAX_MULTI
    return (cargoValue + distanceValue)
  }
}
