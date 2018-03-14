const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const fs = require('fs')

const fetch = require('node-fetch')
const CSV = require('comma-separated-values')

const app = new Koa()

const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    hello: String,
    Locals(ids: [ID!]): [Artwork]
    Artworks(ids: [ID!]): [Artwork]
    getObject(id: ID!): Object
  }
  type Mutation {
    upsertHello(hello: String): String,
    upsertLocals(locals: [ArtworkInput!]): [Artwork]
  }
  type Object {
    primaryMaker: Label,
    primaryMedia: Value,
    displayDate: Label,
    invno: Label,
    id: IntLabel,
    title: Label,
    classification: Label,
    creditline: Label,
    dimensions: Label,
    medium: Label,
    people: ArrayLabel
  }
  type Label {
    label: String,
    value: String
  }
  type IntLabel {
    label: String,
    value: Int
  }
  type ArrayLabel {
    label: String,
    value: [String]
  }
  type Value {
    value: String
  }
  input ArtworkInput {
    id: Int,
    accession_number: String,
    title: String,
    maker: String,
    ULAN: Int,
    department: String,
    classification: String,
    culture: String,
    period: String,
    creation_date: String,
    creation_date_earliest: String,
    creation_date_latest: String,
    accesion_date: String,
    source_name: String,
    object_name: String,
    medium: String,
    dimensions: String,
    credit_line: String,
    paper_support: String,
    catalogue_raisonne: String,
    portfolio: String,
    signed: String,
    marks: String,
    inscriptions: String,
    filename: String
  }
  type Artwork {
    id: Int,
    accession_number: String,
    title: String,
    maker: String,
    ULAN: Int,
    department: String,
    classification: String,
    culture: String,
    period: String,
    creation_date: String,
    creation_date_earliest: String,
    creation_date_latest: String,
    accesion_date: String,
    source_name: String,
    object_name: String,
    medium: String,
    dimensions: String,
    credit_line: String,
    paper_support: String,
    catalogue_raisonne: String,
    portfolio: String,
    signed: String,
    marks: String,
    inscriptions: String,
    filename: String
  }
`)

const emuseum = {
  getObject: async id => {
    const { EMUSEUM_KEY } = process.env
    const uri = `http://egallery.williams.edu/objects/${id}/json?key=${EMUSEUM_KEY}`
    return fetch(uri).then(res => res.json())
  }
}

const wcmaCollection = fs.readFileSync('data/wcma-collection-fixed.csv', {encoding: 'UTF8'})
const csv = CSV.parse(wcmaCollection, {header: true})

const db = {
  hello: `world!`,
  locals: new Map(),
  artworks: new Map(csv.map(object => [object.id, object])),
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

console.dir(db.artworks)

const graphiql = true

app.use(mount('/graphql', graphqlHTTP({ graphiql, schema, rootValue })))

app.listen(4000, () => {
  console.log('Running a GraphQL API server at localhost:4000/graphql')
})
