const fs = require('fs')
const CSV = require('comma-separated-values')

module.exports = ({csvPath}) => {
  const collection = fs.readFileSync(csvPath, { encoding: 'utf8' })
  const csv = CSV.parse(collection, { header: true, lineDelimiter: '\r' })
  const db = new Map(csv.map(object => [object.id, object]))

  return {
      getObjects({ids}) {
        return ids.map(id => db.get(parseInt(id)))
      },
      setObjects({objects}) {
        const newDb = new Map(db)
        objects.forEach(object => newDb.set(object.id, object))
        const objectsString = CSV.encode(Array.from(newDb.values()), {
          header: true
        })
        try {
          fs.writeFileSync(csvPath, objectsString, { encoding: 'UTF8' })
        } catch (err) {
          console.error(err)
          throw new Error(`Could not write to csv!`)
        }
    
        db = newDb
      }
    }
}