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
    body.sort = [{
      count: {
        order: 'desc'
      }
    }]
  }

  if (index === 'objects_wcma') {
    if (
      ('object_name' in args && args.object_name !== '') ||
      ('maker' in args && args.maker !== '') ||
      ('period' in args && args.period !== '') ||
      ('title' in args && args.title !== '') ||
      ('medium' in args && args.medium !== '')
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
  const records = objects.hits.hits.map((hit) => hit._source)
  return records
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
    return object._source
  }
  return null
}