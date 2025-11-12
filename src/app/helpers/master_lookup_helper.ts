import db from '@adonisjs/lucid/services/db'

export const getKeyByLookUpType = async (type: string): Promise<{ [key: string]: number }> => {
  return await db
    .from('master_lookups')
    .where('type', type)
    .where('is_active', true)
    .select(['id', 'value'])
    .then((masterLookup) => {
      let temp: { [key: string]: number } = {}

      masterLookup.forEach((lookup) => {
        temp[lookup.value] = parseInt(lookup.id)
      })

      return temp
    })
}
