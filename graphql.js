const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')

const app = new Koa()

const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    hello: String,
    Artworks(ids: [ID!]): [Artwork]
  }
  type Mutation {
    upsertHello(hello: String): String,
    upsertArtworks(artworks: [ArtworkInput!]): [Artwork]
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

const db = {
  hello: `world!`,
  artworks: new Map()
}

const rootValue = {
  hello: () => db.hello,
  upsertHello: ({ hello }) => {
    previous = db.hello
    db.hello = hello
    return previous
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
