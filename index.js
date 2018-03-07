const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const elasticsearch = require('elasticsearch')

const app = new Koa()

const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    hello: String,
    Artwork: Artwork
  }
  type Mutation {
    setHello: String,
    addArtwork: Artwork
  }
  type Artwork {
    id: Number,
    accession_number: String,
    title: String,
    maker: String,
    ULAN: Number,
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
  hello: `world!`
}

const rootValue = {
  setHello: ({hello}) => {
    db.hello = hello
    return hello
  },
  hello: () => db.hello,
  Artwork: async ({id}) => {
    await elasticsearch.query({id})
  }
}

const graphiql = true

app.use(mount('/graphql', graphqlHTTP({graphiql, schema, rootValue})))

app.listen(4000)
