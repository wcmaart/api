module.exports = ({ emuseumKey }) => {
  const fetch = require('node-fetch')
  const { MISSING_EMUSEUM_KEY } = require('./errors.js')

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
      const rawObjects = await this.getRawObjects({ ids })
      return rawObjects.map(raw => {
        const {
          id: { value: id },
          title: { value: title },
          primaryMaker: { value: maker },
          medium: { value: medium },
          classification: { value: classification },
          creditline: { value: creditline },
          dimensions: { value: dimensions }
        } = raw

        return {
          id,
          title,
          maker,
          medium,
          classification,
          creditline,
          dimensions,
          raw
        }
      })
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
    }
  }
}
