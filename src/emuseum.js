module.exports = ({ emuseumKey }) => {
  const fetch = require('node-fetch')
  const { MISSING_EMUSEUM_KEY } = require('./errors.js')

  if (!emuseumKey) {
    console.error(MISSING_EMUSEUM_KEY.message)
    return {
      getObject (id) {
        throw MISSING_EMUSEUM_KEY
      }
    }
  }

  const turnPersonIntoPeople = object => {
    const people = object.people && object.people.value
    if (people) {
      object.people = Array.isArray(people) ? people : [people]
    }
    return object
  }

  const turnLabelsIntoStrings = object => {
    const labels = [
      'title',
      'primaryMaker',
      'displayDate',
      'invno',
      'id',
      'classification',
      'creditline',
      'dimensions',
      'medium'
    ]
    for (label of labels) {
      const value = object[label] && object[label].value
      if (value) {
        object[label] = value
      }
    }
    return object
  }

  return {
    async getObjects ({ ids }) {
      if (!emuseumKey) throw MISSING_EMUSEUM_KEY

      const response = Promise.all(
        ids.map(async id => {
          const uri = `http://egallery.williams.edu/objects/${id}/json?key=${emuseumKey}`
          return await fetch(uri)
            .then(res => res.json())
            .then(object => object.object)
            .then(turnPersonIntoPeople)
            .then(turnLabelsIntoStrings)
        })
      )
      return response
    }
  }
}
