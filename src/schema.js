const { buildSchema } = require('graphql')
module.exports = buildSchema(`
  # we've got four kinds of things
  type Query {
    # a string billboard, for testing
    hello: String,
    # some in-memory artworks for messing around
    Locals(ids: [ID!]): [Artwork]
    # artworks backed by our csv
    Artworks(ids: [ID!]): [Artwork]
    # objects queried from eMuseum api (requires setting EMUSEUM_KEY)
    getObject(id: ID!): Object
  }

  # There are three mutations which are all upserts, meaning they
  # will update an item if it exists to the new data, or insert if it doesn't exist.
  #
  # Some mutations will write to the underlying data source, some will not.
  type Mutation {

    # This is a test upsert, kinda like a single string in-memory billboard
    upsertHello(input: UpsertHelloInput!): Hello

    # This will update the underlying csv!
    upsertArtworks(artworks: [ArtworkInput!]): [Artwork]

    # This is an in-memory map for messing about
    upsertLocals(locals: [ArtworkInput!]): [Artwork]
  }

  # new greeting contents
  input UpsertHelloInput {
    # who should we say hi to ya?
    hello: String!
  }

  # who are we greeting?
  type Hello {
    hello: String
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
