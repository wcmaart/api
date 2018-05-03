module.exports = ({ emuseumKey }) => {
  const fetch = require('node-fetch')
  const { MISSING_EMUSEUM_KEY } = require('./errors.js')

  const parseRawObject = (raw) => {
    let {
      id: { value: id },
      title: { value: title },
      medium,
      classification,
      creditline,
      dimensions,
      primaryMaker,
      primaryMedia,
      people
    } = raw

    medium = medium && medium.value
    primaryMedia = primaryMedia && primaryMedia.value
    classification = classification && classification.value
    creditline = creditline && creditline.value
    dimensions = dimensions && dimensions.value
    maker = (primaryMaker && primaryMaker.value) || (people && people.value)

    return {
      id,
      title,
      maker,
      medium,
      classification,
      creditline,
      dimensions,
      primaryMedia,
      raw
    }
  }

  if (!emuseumKey) {
    console.error(MISSING_EMUSEUM_KEY.message)
    return {
      async getObjects ({ ids }) {
        throw MISSING_EMUSEUM_KEY
      }
    }
  }

  return {
    async getObjects ({ ids }) {
      let rawObjects;

      if (!ids) {
        rawObjects = await this.getRawObjectsAll()
      }
      else {
        rawObjects = await this.getRawObjects({ ids })
      }

      const objects = rawObjects.map(raw => {
        return parseRawObject(raw);
      })

      return objects
    },
    async getRawObjects ({ ids }) {
      if (!emuseumKey) throw MISSING_EMUSEUM_KEY

      const response = Promise.all(
        ids.map(async id => {
          const uri = `http://egallery.williams.edu/objects/${id}/json?key=${emuseumKey}`
          return await fetch(uri)
            .then(res => res.json())
            .then(object => object.object)
        })
      )
      return response
    },
    async getRawObjectsAll () {
      if (!emuseumKey) throw MISSING_EMUSEUM_KEY

      const uri = `http://egallery.williams.edu/objects/json?key=${emuseumKey}`

      return await fetch(uri)
        .then(res => res.json())
        .then(object => object.objects)
    }
  }
}
