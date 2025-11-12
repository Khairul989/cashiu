export const floorDecimalPoints = (num: number, dp = 2): number => {
  const factor = 10 ** dp

  return Math.floor(num * factor) / factor
}

export const numberFormat = (
  number: number,
  decimals = 2,
  decPoint = '.',
  thousandsSep = ','
): string => {
  if (!isFinite(number)) return '0'

  const fixedNumber = Number(number).toFixed(decimals)
  const parts = fixedNumber.split('.')

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)

  return parts.join(decPoint)
}
