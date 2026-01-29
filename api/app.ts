import { session, errorHandler, createSiteMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import apiDocs from '../contract/api-docs.ts'
import { router } from './routers/capture.ts'
import config from '#config'

const app = express()
export default app

if (config.helmet.active) {
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
      // very restrictive by default, index.html of the UI will have custom rules defined in createSpaMiddleware
      // https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers
        'frame-ancestors': ["'none'"],
        'default-src': ["'none'"]
      }
    }
  }))
}

// no fancy embedded arrays, just string and arrays of strings in req.query
app.set('query parser', 'simple')
app.use(express.json())

app.use(createSiteMiddleware('capture', { prefixOptional: true }))
if (config.privateDirectoryUrl) app.use(session.middleware())

app.use('/api/v1', router)
app.get('/api/v1/api-docs.json', (req, res, next) => res.send(apiDocs))
app.use('/test', express.static('./test'))
app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

app.use(errorHandler)
