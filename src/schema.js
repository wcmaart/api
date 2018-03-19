const { buildSchema } = require('graphql')
module.exports = buildSchema(`
  type Query {
    hello: String,
    Locals(ids: [ID!]): [Artwork]
    Artworks(ids: [ID!]): [Artwork]
    getObject(id: ID!): Object
  }
  type Mutation {
    upsertHello(hello: String): String,
    upsertArtworks(artworks: [ArtworkInput!]): [Artwork],
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