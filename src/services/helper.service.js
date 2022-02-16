export const getRandom = async (arr, n) => {
  return arr.sort(() => Math.random() - Math.random()).slice(0, n)
}

export async function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}