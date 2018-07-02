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
  const sortIfIndex = ['objects_wcma', 'object_types_wcma', 'object_makers_wcma', 'object_periods_wcma', 'object_materials_wcma']
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
      //  For objects we want to actually want to sort by the _id
      if (index === 'objects_wcma' && sortField !== 'title.keyword') {} else {
        const sortObj = {}
        sortObj[sortField] = {
          order: args.sort
        }
        body.sort = [sortObj]
      }
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
      ('keyword' in args && args.keyword !== '') ||
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

      if ('keyword' in args && args.keyword !== '') {
        must.push({
          multi_match: {
            query: args.keyword,
            type: 'best_fields',
            fields: ['title', 'maker', 'description', 'credit_line', 'inscription', 'copyright_holder'],
            operator: 'or'
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

const cleanExhibition = (exhibition) => {
  const newExhibition = {}

  newExhibition.id = exhibition.ExhibitionID
  newExhibition.title = exhibition.ExhTitle
  newExhibition.planningNotes = exhibition.PlanningNotes
  newExhibition.curNotes = exhibition.CurNotes
  newExhibition.isInHouse = exhibition.IsInHouse
  newExhibition.objects = exhibition.ExhObjXrefs
  newExhibition.beginISODate = exhibition.BeginISODate
  newExhibition.endISODate = exhibition.EndISODate
  newExhibition.beginDate = parseInt(new Date(exhibition.BeginISODate).getTime() / 1000, 10)
  newExhibition.endDate = parseInt(new Date(exhibition.EndISODate).getTime() / 1000, 10)
  if (newExhibition.beginDate < -2147483648 || newExhibition.beginDate > 2147483648) newExhibition.beginDate = null
  if (newExhibition.endDate < -2147483648 || newExhibition.endDate > 2147483648) newExhibition.endDate = null
  newExhibition.keyImage = exhibition.keyImage

  return newExhibition
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
  const validFields = ['eventname', 'eventid', 'subject', 'coursenbr']
  const keywordFields = ['eventName', 'subject']
  const validSorts = ['asc', 'desc']
  if ('sort_field' in args && validFields.includes(args.sort_field.toLowerCase()) && 'sort' in args && (validSorts.includes(args.sort.toLowerCase()))) {
    //  To actually sort on a eventName we need to really sort on `eventName.keyword`
    let sortField = args.sort_field
    if (keywordFields.includes(sortField)) sortField = `${sortField}.keyword`

    const sortObj = {}
    sortObj[sortField] = {
      order: args.sort
    }
    body.sort = [sortObj]
  } else {
    body.sort = [{
      eventId: {
        order: 'asc'
      }
    }]
  }

  if (
    ('eventName' in args && args.eventName !== '') ||
    ('subject' in args && args.subject !== '') ||
    ('courseNbr' in args && args.courseNbr !== '') ||
    ('description' in args && args.description !== '') ||
    ('facultyMember' in args && args.facultyMember !== '') ||
    ('eventType' in args && args.eventType !== '') ||
    ('objectID' in args && args.objectID !== '') ||
    ('keyword' in args && args.keyword !== '')
  ) {
    const must = []

    //  Sigh, very bad way to add filters
    //  NOTE: This doesn't combine filters
    if ('eventName' in args && args.eventName !== '') {
      must.push({
        match: {
          eventName: args.eventName
        }
      })
    }

    if ('subject' in args && args.subject !== '') {
      must.push({
        match: {
          subject: args.subject
        }
      })
    }

    if ('courseNbr' in args && args.courseNbr !== '') {
      must.push({
        match: {
          courseNbr: args.courseNbr
        }
      })
    }

    if ('description' in args && args.description !== '') {
      must.push({
        match: {
          description: args.description
        }
      })
    }

    if ('facultyMember' in args && args.facultyMember !== '') {
      must.push({
        match: {
          facultyMember: args.facultyMember
        }
      })
    }

    if ('eventType' in args && args.eventType !== '') {
      must.push({
        match: {
          eventType: args.eventType
        }
      })
    }

    if ('objectID' in args && args.objectID !== '') {
      must.push({
        match: {
          objectID: args.objectID
        }
      })
    }

    if ('keyword' in args && args.keyword !== '') {
      must.push({
        multi_match: {
          query: args.keyword,
          type: 'best_fields',
          fields: ['eventName', 'subject', 'description', 'facultyMember', 'eventType'],
          operator: 'or'
        }
      })
    }

    body.query = {
      bool: {
        must
      }
    }
  }

  const events = await esclient.search({
    index: 'events_wcma',
    body
  }).catch((err) => {
    console.error(err)
  })
  const records = events.hits.hits.map((hit) => hit._source).map((record) => {
    return record
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
    id: id
  }).catch((err) => {
    console.error(err)
  })

  if (event !== undefined && event !== null && 'found' in event && event.found === true) {
    const newEvent = event._source

    if (newEvent.objects.length > 0) {
      args.ids = newEvent.objects
      const objects = await getItems(args, 'objects_wcma')
      newEvent.objects = objects
    }
    return newEvent
  }
  return null
}

exports.getExhibitions = async (args) => {
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

  if (
    ('title' in args && args.title !== '') ||
    ('planningNotes' in args && args.planningNotes !== '') ||
    ('curNotes' in args && args.curNotes !== '') ||
    ('keyword' in args && args.keyword !== '')
  ) {
    const must = []

    //  Sigh, very bad way to add filters
    //  NOTE: This doesn't combine filters
    if ('title' in args && args.title !== '') {
      must.push({
        match: {
          ExhTitle: args.title
        }
      })
    }

    if ('planningNotes' in args && args.planningNotes !== '') {
      must.push({
        match: {
          PlanningNotes: args.planningNotes
        }
      })
    }

    if ('curNotes' in args && args.curNotes !== '') {
      must.push({
        match: {
          CurNotes: args.curNotes
        }
      })
    }

    if ('keyword' in args && args.keyword !== '') {
      must.push({
        multi_match: {
          query: args.keyword,
          type: 'best_fields',
          fields: ['ExhTitle', 'PlanningNotes', 'CurNotes'],
          operator: 'or'
        }
      })
    }

    body.query = {
      bool: {
        must
      }
    }
  }

  const exhibitions = await esclient.search({
    index: 'exhibitions_wcma',
    body
  }).catch((err) => {
    console.error(err)
  })

  const records = exhibitions.hits.hits.map((hit) => hit._source).map((record) => {
    return cleanExhibition(record)
  })
  return records
}

exports.getExhibition = async (args) => {
  const config = new Config()

  //  Grab the elastic search config details
  const elasticsearchConfig = config.get('elasticsearch')
  if (elasticsearchConfig === null) {
    return []
  }

  //  Set up the client
  const esclient = new elasticsearch.Client(elasticsearchConfig)
  const id = args.id
  const index = 'exhibitions_wcma'
  const type = 'exhibition'

  const exhibition = await esclient.get({
    index,
    type,
    id
  }).catch((err) => {
    console.error(err)
  })

  if (exhibition !== undefined && exhibition !== null && 'found' in exhibition && exhibition.found === true) {
    const newExhibition = cleanExhibition(exhibition._source)
    if (newExhibition.objects.length > 0) {
      args.ids = newExhibition.objects
      const objects = await getItems(args, 'objects_wcma')
      newExhibition.objects = objects
    }
    return newExhibition
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

const getObject = async (args) => {
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
    //  Dont log the error if this is a "good" error, i.e. we simple didn't find
    //  a record, no need to spam the error logs
    if (!('body' in err && 'found' in err.body && err.body.found === false)) {
      console.error(err)
    }
  })

  if (object !== undefined && object !== null && 'found' in object && object.found === true) {
    const newObject = cleanObjectColor(object._source)

    //  Now we need to find all the exhibitions that this object lives in
    const exhibitionsBody = {
      query: {
        query_string: {
          fields: ['ExhObjXrefs'],
          query: id
        }
      }
    }
    const exhibitions = await esclient.search({
      index: 'exhibitions_wcma',
      body: exhibitionsBody
    }).catch((err) => {
      console.error(err)
    })
    newObject.exhibitions = exhibitions.hits.hits.map((hit) => hit._source).map((record) => {
      return cleanExhibition(record)
    })

    //  Now we need to find all the events that this object lives in
    const eventsBody = {
      query: {
        query_string: {
          fields: ['objects'],
          query: id
        }
      }
    }
    const events = await esclient.search({
      index: 'events_wcma',
      body: eventsBody
    }).catch((err) => {
      console.error(err)
    })
    newObject.events = events.hits.hits.map((hit) => hit._source).map((record) => {
      return record
    })

    return newObject
  }
  return null
}
exports.getObject = getObject
