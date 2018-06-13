const elasticsearch = require('elasticsearch')
const Config = require('../../classes/config')

const getPage = (args) => {
  const defaultPage = 0
  if ('page' in args) {
    try {
      const page = parseInt(args.page, 10)
      if (page < 0) {
        return defaultPage
      }
      return page
    } catch (er) {
      return defaultPage
    }
  }
  return defaultPage
}

const getPerPage = (args) => {
  const defaultPerPage = 50
  if ('per_page' in args) {
    try {
      const perPage = parseInt(args.per_page, 10)
      if (perPage < 0) {
        return defaultPerPage
      }
      return perPage
    } catch (er) {
      return defaultPerPage
    }
  }
  return defaultPerPage
}

const cleanObjectColor = (object) => {
  const newObject = object

  //  Set up the defaults
  if (!('color' in newObject)) newObject.color = {}
  if (!('predominant' in newObject.color)) newObject.color.predominant = '{}'
  if (!('search' in newObject.color)) newObject.color.search = {}
  if (!('google' in newObject.color.search)) newObject.color.search.google = []
  if (!('cloudinary' in newObject.color.search)) newObject.color.search.cloudinary = []

  //  convert to the format we want
  const newPredominant = []
  Object.entries(JSON.parse(newObject.color.predominant)).forEach((entry) => {
    newPredominant.push({
      color: entry[0],
      value: entry[1]
    })
  })
  newObject.color.predominant = newPredominant

  const newGoogle = []
  Object.entries(newObject.color.search.google).forEach((entry) => {
    newGoogle.push({
      color: entry[0],
      value: entry[1]
    })
  })
  newObject.color.search.google = newGoogle

  const newCloudinary = []
  Object.entries(newObject.color.search.cloudinary).forEach((entry) => {
    newCloudinary.push({
      color: entry[0],
      value: entry[1]
    })
  })
  newObject.color.search.cloudinary = newCloudinary
  if (newObject.color.predominant.length === 0) newObject.color.predominant = null
  if (newObject.color.search.google.length === 0) newObject.color.search.google = null
  if (newObject.color.search.cloudinary.length === 0) newObject.color.search.cloudinary = null
  return newObject
}

const getItems = async (args, index) => {
  const config = new Config()

  //  Grab the elastic search config details
  const elasticsearchConfig = config.get('elasticsearch')
  if (elasticsearchConfig === null) {
    return []
  }

  //  Set up the client
  const esclient = new elasticsearch.Client(elasticsearchConfig)
  const page = getPage(args)
  const perPage = getPerPage(args)
  const body = {
    from: page * perPage,
    size: perPage
  }

  //  Sort by count if the index is one of these
  const sortIfIndex = ['object_types_wcma', 'object_makers_wcma', 'object_periods_wcma', 'object_materials_wcma']
  if (sortIfIndex.includes(index)) {
    //  Check to see if we have been passed valid sort fields values, if we have
    //  then use that for a sort. Otherwise use a default one
    const validFields = ['count', 'title', 'id']
    const keywordFields = ['title']
    const validSorts = ['asc', 'desc']
    if ('sort_field' in args && validFields.includes(args.sort_field.toLowerCase()) && 'sort' in args && (validSorts.includes(args.sort.toLowerCase()))) {
      //  To actually sort on a title we need to really sort on `title.keyword`
      let sortField = args.sort_field
      if (keywordFields.includes(sortField)) sortField = `${sortField}.keyword`
      const sortObj = {}
      sortObj[sortField] = {
        order: args.sort
      }
      body.sort = [sortObj]
    } else {
      body.sort = [{
        id: {
          order: 'asc'
        }
      }]
    }
  }

  if (index === 'objects_wcma') {
    if (
      ('object_name' in args && args.object_name !== '') ||
      ('maker' in args && args.maker !== '') ||
      ('period' in args && args.period !== '') ||
      ('title' in args && args.title !== '') ||
      ('medium' in args && args.medium !== '') ||
      ('color' in args && args.color !== '') ||
      ('ids' in args && Array.isArray(args.ids))
    ) {
      const must = []

      //  Sigh, very bad way to add filters
      //  NOTE: This doesn't combine filters
      if ('object_name' in args && args.object_name !== '') {
        must.push({
          match: {
            object_name: args.object_name
          }
        })
      }

      if ('maker' in args && args.maker !== '') {
        must.push({
          match: {
            maker: args.maker
          }
        })
      }

      if ('period' in args && args.period !== '') {
        must.push({
          match: {
            period: args.period
          }
        })
      }

      if ('medium' in args && args.medium !== '') {
        must.push({
          match: {
            medium: args.medium
          }
        })
      }

      if ('title' in args && args.title !== '') {
        must.push({
          match: {
            title: args.title
          }
        })
      }

      if ('ids' in args && Array.isArray(args.ids)) {
        must.push({
          terms: {
            id: args.ids
          }
        })
      }

      if ('color' in args && args.color !== '') {
        const googleColors = ['gray',
          'black',
          'orange',
          'brown',
          'white',
          'yellow',
          'teal',
          'blue',
          'green',
          'red',
          'pink',
          'purple'
        ]
        const cloudinaryColors = ['white',
          'gray',
          'black',
          'orange',
          'brown',
          'yellow',
          'teal',
          'lightblue',
          'green',
          'olive',
          'red',
          'blue',
          'pink',
          'purple',
          'lime',
          'cyan'
        ]

        let newThreshold = 75.0
        if (Number(args.color_threshold) && args.color_threshold >= 0.0 && args.color_threshold <= 100) {
          newThreshold = args.color_threshold
        }

        if (args.color_source === 'google' && googleColors.includes(args.color)) {
          const colorFilter = {}
          colorFilter[`color.search.google.${args.color}`] = {
            gte: newThreshold
          }
          must.push({
            range: colorFilter
          })
        }
        if (args.color_source === 'cloudinary' && cloudinaryColors.includes(args.color)) {
          const colorFilter = {}
          colorFilter[`color.search.cloudinary.${args.color}`] = {
            gte: newThreshold
          }
          must.push({
            range: colorFilter
          })
        }
      }

      body.query = {
        bool: {
          must
        }
      }
    }
  }

  const objects = await esclient.search({
    index,
    body
  }).catch((err) => {
    console.error(err)
  })

  const records = objects.hits.hits.map((hit) => hit._source).map((record) => {
    //  Because of the way ES returns the items as an array of single arrays
    //  we are popping them out into a single array, i.e.
    //  [[x],[x],[x],[x],[x]] => [x,x,x,x,x]
    if ('images' in record) {
      record.images = record.images.map((image) => {
        if (Array.isArray(image)) {
          return image[0]
        }
        return image
      })
    }
    return record
  })

  return records.map((record) => cleanObjectColor(record))
}

const cleanEvent = (event) => {
  const newEvent = {}

  newEvent.id = event.ExhibitionID
  newEvent.title = event.ExhTitle
  newEvent.planningNotes = event.PlanningNotes
  newEvent.curNotes = event.CurNotes
  newEvent.isInHouse = event.IsInHouse
  newEvent.objects = event.ExhObjXrefs
  newEvent.beginISODate = event.BeginISODate
  newEvent.endISODate = event.EndISODate
  newEvent.beginDate = parseInt(new Date(event.BeginISODate).getTime() / 1000, 10)
  newEvent.endDate = parseInt(new Date(event.EndISODate).getTime() / 1000, 10)
  if (newEvent.beginDate < -2147483648 || newEvent.beginDate > 2147483648) newEvent.beginDate = null
  if (newEvent.endDate < -2147483648 || newEvent.endDate > 2147483648) newEvent.endDate = null

  return newEvent
}

exports.getEvents = async (args) => {
  const config = new Config()

  //  Grab the elastic search config details
  const elasticsearchConfig = config.get('elasticsearch')
  if (elasticsearchConfig === null) {
    return []
  }

  //  Set up the client
  const esclient = new elasticsearch.Client(elasticsearchConfig)
  const page = getPage(args)
  const perPage = getPerPage(args)
  const body = {
    from: page * perPage,
    size: perPage
  }

  //  Check to see if we have been passed valid sort fields values, if we have
  //  then use that for a sort. Otherwise use a default one
  const validFields = ['title', 'id', 'beginisodate', 'endisodate']
  const keywordFields = ['ExhTitle']
  const validSorts = ['asc', 'desc']
  if ('sort_field' in args && validFields.includes(args.sort_field.toLowerCase()) && 'sort' in args && (validSorts.includes(args.sort.toLowerCase()))) {
    //  To actually sort on a title we need to really sort on `ExhTitle.keyword`
    let sortField = args.sort_field
    if (sortField === 'title') sortField = 'ExhTitle'
    if (sortField === 'id') sortField = 'ExhibitionID'
    if (sortField === 'beginISODate') sortField = 'BeginISODate'
    if (sortField === 'endISODate') sortField = 'EndISODate'
    if (keywordFields.includes(sortField)) sortField = `${sortField}.keyword`

    const sortObj = {}
    sortObj[sortField] = {
      order: args.sort
    }
    body.sort = [sortObj]
  } else {
    body.sort = [{
      ExhibitionID: {
        order: 'asc'
      }
    }]
  }

  const events = await esclient.search({
    index: 'events_wcma',
    body
  }).catch((err) => {
    console.error(err)
  })
  const records = events.hits.hits.map((hit) => hit._source).map((record) => {
    return cleanEvent(record)
  })
  return records
}

exports.getEvent = async (args) => {
  const config = new Config()

  //  Grab the elastic search config details
  const elasticsearchConfig = config.get('elasticsearch')
  if (elasticsearchConfig === null) {
    return []
  }

  //  Set up the client
  const esclient = new elasticsearch.Client(elasticsearchConfig)
  const id = args.id
  const index = 'events_wcma'
  const type = 'event'

  const event = await esclient.get({
    index,
    type,
    id
  }).catch((err) => {
    console.error(err)
  })

  if (event !== undefined && event !== null && 'found' in event && event.found === true) {
    const newEvent = cleanEvent(event._source)
    if (newEvent.objects.length > 0) {
      args.ids = newEvent.objects
      const objects = await getItems(args, 'objects_wcma')
      newEvent.objects = objects
    }
    return newEvent
  }
  return null
}

exports.getObjects = async (args) => {
  const records = await getItems(args, 'objects_wcma')
  return records
}

exports.getObjectNames = async (args) => {
  const records = await getItems(args, 'object_types_wcma')
  return records
}

exports.getMakers = async (args) => {
  const records = await getItems(args, 'object_makers_wcma')
  return records
}

exports.getPeriods = async (args) => {
  const records = await getItems(args, 'object_periods_wcma')
  return records
}

exports.getMediums = async (args) => {
  const records = await getItems(args, 'object_materials_wcma')
  return records
}

exports.getObject = async (args) => {
  const config = new Config()

  //  Grab the elastic search config details
  const elasticsearchConfig = config.get('elasticsearch')
  if (elasticsearchConfig === null) {
    return []
  }

  //  Set up the client
  const esclient = new elasticsearch.Client(elasticsearchConfig)
  const id = args.id
  const index = 'objects_wcma'
  const type = 'object'

  const object = await esclient.get({
    index,
    type,
    id
  }).catch((err) => {
    console.error(err)
  })

  if (object !== undefined && object !== null && 'found' in object && object.found === true) {
    const newObject = cleanObjectColor(object._source)
    return newObject
  }
  return null
}
