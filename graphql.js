const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')

const fetch = require('node-fetch')

const app = new Koa()

const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    hello: String,
    Artworks(ids: [ID!]): [Artwork]
    getObject(id: ID!): Object
  }
  type Mutation {
    upsertHello(hello: String): String,
    upsertArtworks(artworks: [ArtworkInput!]): [Artwork]
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
  getObject: async (id) => {
    const { EMUSEUM_KEY } = process.env
    const uri = `http://egallery.williams.edu/objects/${id}/json?key=${EMUSEUM_KEY}`
    return fetch(uri).then(res => res.json())
  }
}

const db = {
  hello: `world!`,
  artworks: new Map(),
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
    artworks.forEach(artwork => db.artworks.set(artwork.id, artwork))
    return previous
  }
}

const graphiql = true

app.use(mount('/graphql', graphqlHTTP({ graphiql, schema, rootValue })))

app.listen(4000, () => {
  console.log('Running a GraphQL API server at localhost:4000/graphql')
})
