'use strict'

const express = require('express')
const http = require('http')
const path = require('path')
const logger = require('morgan')
const Primus = require('primus')
const expressSession = require('express-session')

/**
 * Controllers (route handlers and event listeners)
 */
const homeController = require('./controllers/home')
const gameController = require('./controllers/game')

/**
 * Configure Express server
 */
const app = express()
const server = http.createServer(app)

const session = expressSession({
    secret: 'shhhhhhhh be quiet',
    resave: true,
    saveUninitialized: true,
})

app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session)

/**
 * Configure Primus
 */
const primus = new Primus(server, {
    pathname: '/gameserver',
    transformer: 'websockets',
})

primus.use('session', session)

// Regenerates and saves client-side library according to configuration above
// Should be minified and served from a CDN in production but this is convenient for development
primus.save(path.join(__dirname, 'public/js/primus.js'))

/**
 * Express routes
 */
app.get('/', homeController.index)

/**
 * Primus listeners
 */
primus.on('connection', gameController.connection)
primus.on('error', gameController.error)

/**
 * Start Express server
 */
server.listen(app.get('port'), () => {
    console.log('Server started at http://localhost:%d in %s mode', app.get('port'), app.get('env'))
    console.log('Press CTRL-C to stop\n')
})
