const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const fs = require('fs')

const fetch = require('node-fetch')
const CSV = require('comma-separated-values')

const app = new Koa()

const schema = require('./src/schema.js')

const emuseum = {
  getObject: async id => {
    const { EMUSEUM_KEY } = process.env
    const uri = `http://egallery.williams.edu/objects/${id}/json?key=${EMUSEUM_KEY}`
    return fetch(uri).then(res => res.json())
  }
}

const startDate = new Date()
const csvPath = 'data/wcma-collection.csv'
const wcmaCollection = fs.readFileSync(csvPath, {encoding: 'utf8'})
const csv = CSV.parse(wcmaCollection, {header: true, lineDelimiter: '\r'})

const db = {
  hello: `world!`,
  locals: new Map(),
  artworks: new Map(csv.map(object => [object.id, object])),
  objects: {
    getFromEmuseum: emuseum.getObject
  }
}

const time = (new Date()) - startDate
console.log(`Imported ${db.artworks.size} artworks from ${csvPath} in ${time}ms`)

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
    artworks.forEach(artwork => db.artworks.set(artwork.id, artwork))
    const values = db.artworks.values()
    const artworksString = CSV.encode(Array.from(values), {header: true})
    fs.writeFile(csvPath, artworksString, {encoding: 'UTF8'})
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

app.use(mount('/graphql', graphqlHTTP({ graphiql, schema, rootValue })))

const { GRAPHQL_HOST = 'localhost', GRAPHQL_PORT = 4000 } = process.env

app.listen(GRAPHQL_PORT, GRAPHQL_HOST, () => {
    console.log(`GraphQL listening on ${GRAPHQL_HOST}:${GRAPHQL_PORT}/graphql`)
})
