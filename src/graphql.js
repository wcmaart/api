const Koa = require('koa')
const mount = require('koa-mount')
const cors = require('@koa/cors')
const proxy = require('koa-better-http-proxy')
const httpsProxyAgent = require('https-proxy-agent')
const graphqlHTTP = require('koa-graphql')
const koaPlayground = require('graphql-playground-middleware-koa').default
const voyager = require('graphql-voyager/middleware').koa

const opn = require('opn')
const getPort = require('get-port')
const app = new Koa()
const schema = require('./schema.js')

const emuseumKey = process.env.EMUSEUM_KEY
const emuseum = require('./emuseum.js')({ emuseumKey })

const csvPath = 'data/wcma-collection.csv'
const csvmuseum = require('./csvmuseum')({ csvPath })

const db = {
  there: `General Kenobi!`
}

const rootValue = {
  hello: () => db.hello,
  objects: async ids => {
    try {
      return {
        objects: await emuseum.getObjects(ids),
        source: 'emuseum'
      }
    } catch (e) {
      return {
        objects: await csvmuseum.getObjects(ids),
        source: 'csv'
      }
    }
  },
  setHello: ({ hello }) => {
    previous = db.hello
    db.hello = hello
    return previous
  },
  setObjects: async ({ objects }) => {
    const ids = objects.map(({ id }) => id)
    const previous = await this.query.objects(ids)
    csvmuseum.setObjects({ objects })
    return previous
  }
}

app.use(cors())

app.use(
  mount(
    '/graphql',
    graphqlHTTP(async request => {
      const start = Date.now()
      const extensions = ({ document, variables, operationName, result }) => ({
        duration: new Date() - start
      })
      return { schema, rootValue, extensions }
    })
  )
)

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

getPort({ port: 4000 }).then(port => {
  app.listen(port, () => {
    const base = `http://localhost:${port}`
    console.log(`API: ${base}/graphql`)
    console.log(`Playground: ${base}/playground`)
    opn(`${base}/playground`)
  })
})
