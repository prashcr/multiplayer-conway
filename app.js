'use strict'

const express = require('express')
const http = require('http')
const path = require('path')
const logger = require('morgan')
const Primus = require('primus')

/**
 * Create Express server and Primus instance
 */
const app = express()
const server = http.createServer(app)
const primus = new Primus(server, {
    pathname: '/gameserver',
    transformer: 'uws',
})
// Regenerates and saves client-side library according to configuration above
// Should be minified and served from a CDN in production but this is convenient for development
primus.save(path.join(__dirname, 'public/js/primus.js'))

/**
 * Configure Express server
 */
app.set('port', process.env.PORT || 3000)
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))

/**
 * Primus listeners
 */
primus.on('connection', (spark) => {
    spark.write('Connected to server')
})

primus.on('error', (err) => {
    console.error(err.stack)
})

/**
 * Start Express server
 */
server.listen(app.get('port'), () => {
    console.log('Server started at http://localhost:%d in %s mode', app.get('port'), app.get('env'))
    console.log('Press CTRL-C to stop\n')
})
