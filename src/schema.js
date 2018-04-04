const { buildSchema } = require('graphql')
const fs = require('fs')
const schema = fs.readFileSync(`${__dirname}/schema.graphql`).toString()
module.exports = buildSchema(schema)
