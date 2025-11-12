import crypto from 'crypto'

export const isValidHttpUrl = (string: string) => {
  let url

  try {
    url = new URL(string)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}

export const generateRandomId = () => {
  const data = crypto.randomBytes(16)

  // set version to 0100
  data[6] = (data[6] & 0x0f) | 0x40
  // set bits 6-7 to 10
  data[8] = (data[8] & 0x3f) | 0x80

  // return as a 32‑char hex string (same as PHP’s vsprintf+bin2hex)
  return data.toString('hex')
}

export const generateRandomString = (length: number = 6, chars: string = 'A#') => {
  let mask = ''

  if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz'
  if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (chars.indexOf('#') > -1) mask += '0123456789'
  if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\'

  let result = ''
  for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)]

  return result
}
