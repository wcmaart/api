const fs = require('fs')
const CSV = require('comma-separated-values')
const { CSV_READ_ERROR, CSV_WRITE_ERROR } = require('./errors.js')

module.exports = ({ csvPath }) => {
  try {
    const collection = fs.readFileSync(csvPath, { encoding: 'utf8' })
    const csv = CSV.parse(collection, { header: true, lineDelimiter: '\r' })
    const db = new Map(csv.map(object => [object.id, object]))
  } catch (e) {
    console.error(CSV_ERROR.message)

    return {
      getObjects (id) {
        throw CSV_ERROR
      }
    }
  }

  return {
    getObjects ({ ids }) {
      return ids.map(id => db.get(parseInt(id)))
    },
    setObjects ({ objects }) {
      const newDb = new Map(db)
      objects.forEach(object => newDb.set(object.id, object))
      const objectsString = CSV.encode(Array.from(newDb.values()), {
        header: true
      })
      try {
        fs.writeFileSync(csvPath, objectsString, { encoding: 'UTF8' })
      } catch (e) {
        console.error(e)
        throw CSV_WRITE_ERROR
      }

      db = newDb
    }
  }
}
