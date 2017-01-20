'use strict'

const express = require('express')
const http = require('http')
const path = require('path')
const logger = require('morgan')
const Primus = require('primus')
const expressSession = require('express-session')
const primusEmit = require('primus-emit')

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
    transformer: 'websockets',
})

primus.use('session', session)
primus.plugin('emit', primusEmit)

/**
 * Controllers (route handlers and event listeners)
 */
const homeController = require('./controllers/home')
const gameController = require('./controllers/game')(primus)

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
