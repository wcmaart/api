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
require('dotenv').config()
const emuseumKey = process.env.EMUSEUM_KEY
const emuseum = require('./emuseum.js')({ emuseumKey })

const csvPath = 'data/wcma-collection.csv'
const csvmuseum = require('./csvmuseum')({ csvPath })

// todo: add this back later
// const xmlPath = 'EventsWithObjects_4_30_18.xml'
// const xmlmuseum = require('./xmlmuseum')({ xmlPath })

const schemaPath = `${__dirname}/schema.graphql`
const typeDefs = require('fs')
  .readFileSync(schemaPath)
  .toString()

const db = {
  hello: {
    there: `General Kenobi!`
  }
}

const objectResolver = async ({ ids, paginationIdx, filter }) => {
  let objects
  try {
    objects = await emuseum.getObjects({ ids, paginationIdx })
  } catch (e) {
    objects = csvmuseum.getObjects({ ids })
  }

  if (filter) {
    return objects.filter(({ title }) => title && title.includes(filter))
  }

  return objects
}

const resolvers = {
  Query: {
    hello: () => db.hello,
    objects: (_, args) => objectResolver(args),
    // todo: add this back later
    // events: async (_, args) => {
    //   return xmlmuseum.getEvents(args)
    // }
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
  Event: {
    objects ({ HistObjXIDs }, args) {
      return objectResolver({ ids: HistObjXIDs, ...args })
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
app.use(mount('/graphql', graphqlKoa({ schema, tracing: true })))

// egallery proxy so we can get pictures
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
