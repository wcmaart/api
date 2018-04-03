const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const fs = require('fs')

const fetch = require('node-fetch')
const CSV = require('comma-separated-values')

const app = new Koa()

const schema = require('./src/schema.js')
const csvPath = 'data/wcma-collection.csv'

const csvToMap = () => {
  const wcmaCollection = fs.readFileSync(csvPath, { encoding: 'utf8' })
  const csv = CSV.parse(wcmaCollection, { header: true, lineDelimiter: '\r' })
  return new Map(csv.map(object => [object.id, object]))
}

const timed = fn => (...args) => {
  const start = new Date()
  const call = `${fn.name}(${args.join(', ')})`
  console.log(`  ${call} started at ${start}`)
  let response = fn(...args)
  const duration = new Date() - start
  console.log(`  ${call} took ${duration}ms`)
  return response
}

const emuseum = {
  getObject: async id => {
    const { EMUSEUM_KEY } = process.env
    if (!EMUSEUM_KEY) throw new Error('Missing EMUSEUM_KEY, please export it')
    const uri = `http://egallery.williams.edu/objects/${id}/json?key=${EMUSEUM_KEY}`
    return fetch(uri).then(res => res.json())
  }
}

const db = {
  hello: `world!`,
  locals: new Map(),
  artworks: timed(csvToMap)(),
  objects: {
    getFromEmuseum: emuseum.getObject
  }
}

const rootValue = {
  hello: () => db.hello,
  upsertHello: ({ hello }) => {
    previous = db.hello
    db.hello = hello
    return previous
  },
  getObject: async ({ id }) => {
    const object = await db.objects.getFromEmuseum(id)
    let thing = object.object
    return thing
  },
  Artworks: ({ ids }) => {
    const artworks = ids.map(id => db.artworks.get(parseInt(id)))
    return artworks
  },
  upsertArtworks: ({ artworks }) => {
    const previous = artworks.map(({ id }) => db.artworks.get(id))
    const newArtworks = new Map(db.artworks)
    artworks.forEach(artwork => newArtworks.set(artwork.id, artwork))
    const artworksString = CSV.encode(Array.from(newArtworks.values()), { header: true })
    try {
      fs.writeFileSync(csvPath, artworksString, { encoding: 'UTF8' })
    } catch (err) {
      console.error(err)
      throw new Error(`Could not write to csv!`)
    }

    db.artworks = newArtworks
    return previous
  },
  Locals: ({ ids }) => {
    const locals = ids.map(id => db.locals.get(parseInt(id)))
    return locals
  },
  upsertLocal: ({ locals }) => {
    const previous = locals.map(({ id }) => db.locals.get(id))
    locals.forEach(artwork => db.locals.set(local.id, local))
    return previous
  }
}

const graphiql = true

app.use(mount('/graphql', graphqlHTTP(request => {
  const start = Date.now()
  const extensions = ({ document, variables, operationName, result }) => ({
    duration: (new Date()) - start
  })
  return { graphiql, schema, rootValue, extensions }
})))

app.listen(4000, () => {
  console.log('Running a GraphQL API server at localhost:4000/graphql')
})
