import { createPolygon } from './geo.service'

describe('create polygon', () => {
  test('polygon should have 17 points', async () => {
    const poly = await createPolygon(52.24166, -2.88111, 50)
    expect(poly).toHaveLength(17)
  })

  test('polygon first and last should be the same', async () => {
    const poly = await createPolygon(52.24166, -2.88111, 50)
    expect(poly[0][0]).toEqual(poly[16][0])
  })
})
