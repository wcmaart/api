const Koa = require('koa')
const mount = require('koa-mount')
const cors = require('@koa/cors')
const proxy = require('koa-better-http-proxy')
const body = require('koa-bodyparser')
const { graphqlKoa } = require('apollo-server-koa')
const { makeExecutableSchema } = require('graphql-tools')
const app = new Koa()

// Utilities
const koaPlayground = require('graphql-playground-middleware-koa').default
const voyager = require('graphql-voyager/middleware').koa

// our api!
const emuseumKey = process.env.EMUSEUM_KEY
const emuseum = require('./emuseum.js')({ emuseumKey })

const csvPath = 'data/wcma-collection.csv'
const csvmuseum = require('./csvmuseum')({ csvPath })

const xmlPath = 'EventsWithObjects_4_30_18.xml'
const xmlmuseum = require('./xmlmuseum')({ xmlPath })

const schemaPath = `${__dirname}/schema.graphql`
const typeDefs = require('fs')
  .readFileSync(schemaPath)
  .toString()

const db = {
  there: `General Kenobi!`
}

const resolvers = {
  Query: {
    hello: () => db.hello,
    objects: async (_, ids) => {
      try {
        return await emuseum.getObjects(ids)
      } catch (e) {
        return csvmuseum.getObjects(ids)
      }
    },
    events: async (_, ids) => {
      return xmlmuseum.getEvents(ids)
    }
  },
  Mutation: {
    setHello: (_, { hello }) => {
      const previous = db.hello
      db.hello = hello
      return previous
    },
    setObjects: async (_, { objects }) => {
      const ids = objects.map(({ id }) => id)
      const previous = await this.query.objects(ids)
      csvmuseum.setObjects({ objects })
      return previous
    }
  },
  RawObject: {
    __resolveType (object, info) {
      if ('accession_number' in object) {
        return 'CsvObject'
      } else {
        return 'EmuseumObject'
      }
    }
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

app.use(cors())
app.use(body())

// Api endpoint for graphql
app.use(
  mount(
    '/graphql',
    graphqlKoa(async request => {
      const start = Date.now()
      const extensions = ({ document, variables, operationName, result }) => ({
        duration: Date.now() - start
      })
      return { schema, extensions }
    })
  )
)

// Image proxy so we can get pictures
app.use(
  mount(
    '/egallery',
    proxy('http://egallery.williams.edu', {
      proxyReqPathResolver: ctx => {
        return require('url')
          .parse(ctx.url)
          .path.replace(/^\/egallery/, '')
      }
    })
  )
)

app.use(
  mount(
    '/playground',
    koaPlayground({
      endpoint: '/graphql'
    })
  )
)

app.use(
  mount(
    '/voyager',
    voyager({
      endpointUrl: '/graphql'
    })
  )
)

// Start the server on 4000 or first available port
const getPort = require('get-port')
getPort({ port: 4000 }).then(port => {
  app.listen(port, () => {
    const base = `http://localhost:${port}`
    console.log(`API: ${base}/graphql`)
    console.log(`Playground: ${base}/playground`)

    const opn = require('opn')
    opn(`${base}/playground`)
  })
})
