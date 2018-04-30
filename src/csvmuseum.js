const fs = require('fs')
const CSV = require('comma-separated-values')
const { CSV_READ_ERROR, CSV_WRITE_ERROR } = require('./errors.js')

module.exports = ({ csvPath }) => {
  let db
  try {
    const collection = fs.readFileSync(csvPath, { encoding: 'utf8' })
    const cast = [
      'Number', // id
      'String', // accession_number
      'String', // title
      'String', // maker
      'Number', // ULAN
      'String', // department
      'String', // classification
      'String', // culture
      'String', // period
      'String', // creation_date
      'String', //creation_date_earliest
      'String', // creation_date_latest
      'String', // accession_date
      'String', //source_name
      'String', // object_name
      'String', // medium
      'String', // dimensions
      'String', // description
      'String', // credit_line
      'String', // paper_support
      'String', // catalogue_raisonne
      'String', // portfolio
      'String', // signed
      'String', // marks
      'String', // inscriptions
      'String'  // filename
    ]
    const csv = CSV.parse(collection, { header: true, lineDelimiter: '\r', cast })
    db = new Map(csv.map(object => [object.id, object]))
  } catch (e) {
    console.error(CSV_READ_ERROR.message)

    return {
      getObjects (id) {
        throw CSV_READ_ERROR
      }
    }
  }

  return {
    getObjects ({ ids }) {
      const rawObjects = this.getRawObjects({ ids })
      const objects = rawObjects.map(raw => {
        const {
          id,
          title,
          medium,
          maker,
          dimensions,
          classification,
          credit_line: creditline
        } = raw
        return {
          id,
          title,
          medium,
          maker,
          dimensions,
          classification,
          creditline,
          raw
        }
      })
      return objects
    },
    getRawObjects ({ ids }) {
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
