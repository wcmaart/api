module.exports = ({emuseumKey}) => {
  const fetch = require('node-fetch')

  if (!emuseumKey) {
    console.error('You may want to set EMUSEUM_KEY in your environment')
    return {
      getObject(id) { throw new Error('Missing EMUSEUM_KEY, please export it') }
    }
  }

  const turnPersonIntoPeople = object => {
    const people = object.people && object.people.value
    if (people) {
      object.people = Array.isArray(people) ? people : [people]
    }
    return object
  }

  const turnTitleLabelIntoTitleString = object => {
    const title = object.title && object.title.value
    if (title) {
      object.title = title
    }
    return object
  }

  return {
    async getObjects({ids}) {
      if (!emuseumKey)
        throw new Error('Missing EMUSEUM_KEY, please export it')
      
      const response = Promise.all(ids.map(async id => {
        const uri = `http://egallery.williams.edu/objects/${id}/json?key=${emuseumKey}`
        return await fetch(uri)
          .then(res => res.json())
          .then(object => object.object)
          .then(turnPersonIntoPeople)
          .then(turnTitleLabelIntoTitleString)
      }))
      return response
    }
  }
}