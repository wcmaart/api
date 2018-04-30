const fs = require('fs')
const { parseString, processors } = require('xml2js')
const { parseNumbers } = processors
const { XML_READ_ERROR, XML_WRITE_ERROR } = require('./errors.js')

module.exports = ({ xmlPath }) => {
  const options = {
    explicitArray: false,
    trim: true,
    valueProcessors: [parseNumbers]
  }

  let db
  try {
    const eventsXml = fs.readFileSync(xmlPath, { encoding: 'utf8' })
    parseString(eventsXml, options, (err, xml) => {
      if (err) throw XML_PARSE_ERROR
      const eventList = xml.Events.Event
      db = new Map(eventList.map(event => [parseInt(event.eventId), event]))
    })
  } catch (e) {
    e = e || XML_READ_ERROR
    console.error(e.message)

    return {
      getEvents (_) {
        throw e
      }
    }
  }

  return {
    getEvents ({ ids }) {
      const rawEvents = this.getRawEvents({ ids })
      const events = rawEvents.map(rawEvent => {
        const {
          eventId,
          eventName,
          facultyMember,
          subjectAndCourse,
          subject,
          courseNbr,
          institution,
          Description,
          startDate,
          histObjXrefs
        } = rawEvent

        const event = {
          eventId,
          eventName,
          facultyMember,
          subjectAndCourse,
          subject,
          courseNumber: courseNbr,
          institution,
          Description,
          startDate: new Date(startDate),
          objects: histObjXrefs
        }
        return event
      })
      return events
    },
    getRawEvents ({ ids }) {
      return ids.map(id => db.get(parseInt(id)))
    }
  }
}
