import { bearingToAzimuth, degreesToRadians, radiansToDegrees } from '@turf/helpers'
import { EARTH_RADIUS } from '../constants.js'
import {distance, point, bearing} from '@turf/turf'

export const createPolygon = async (lat, lon, distance) => {
  const n = 16
  const flatCoordinates = []
  const coordinates = []
  for (let i = 0; i < n; i++) {
    const bearing = 2 * Math.PI * i / n
    const offsetCalc = await offset(lat, lon, distance, bearing)
    const co = [offsetCalc.lat, offsetCalc.lon]
    console.log(`Created Poly: ${[co]}`)
    flatCoordinates.push([co])
  }

  flatCoordinates.push(flatCoordinates[0])
  return flatCoordinates
}

export const getDistanceBetweenPoints = async (latFrom, lonFrom, latTo, lonTo) => {
  const dep = point([lonFrom, latFrom])
  const arr = point([lonTo, latTo])

  return distance(dep, arr, { units: 'nauticalmiles' })
}

export const getBearingBetweenPoints = async (latFrom, lonFrom, latTo, lonTo) => {
  const dep = point([lonFrom, latFrom])
  const arr = point([lonTo, latTo])
  const b = bearing(dep, arr)
  return bearingToAzimuth(b)
}

const offset = async (lat, lon, distance, bearing) => {
  const lat1 = degreesToRadians(lat)
  const lon1 = degreesToRadians(lon)

  const dByR = distance / EARTH_RADIUS

  const finalLat = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) + Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing)
  )

  const finalLon = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
    Math.cos(dByR) - Math.sin(lat1) * Math.sin(finalLat)
  )

  return {
    lat: radiansToDegrees(finalLat),
    lon: radiansToDegrees(finalLon)
  }
}