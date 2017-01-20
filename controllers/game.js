/**
 * Back-end Primus code
 */

'use strict'

/**
 * I usually wouldn't import a library for something that could be accomplished
 * with 3 random numbers however:
 *
 * 1) Random RGB values gives you murky crap
 * since you have no control over saturation/brightness/lightness
 * 2) Random hue with constant S, L in HSL is an improvement
 * However keeping S,L constant limits the range of colors
 * Additionally, (human) perceptually acceptable S,L values vary by hue
 *
 * This library segments the hue range and defines upper+lower bounds
 * for randomly selected S,L values for each hue segment
 * tl;dr pretty colors
 */
const randomColor = require('randomcolor')

const cols = 150
const rows = 100
const gameState = new Array(cols * rows).fill(-1) // fill with white

/**
 * When a new connection is received
 */
exports.connection = (spark) => {
    const req = spark.request

    if (!req.session.color) {
        req.session.color = randomColor({
            format: 'rgba',
            alpha: 1,
        })
        req.session.save()
    }

    spark.emit('game::player::color', req.session.color)
    spark.emit('game::state', gameState)
}

/**
 * When an error occurs
 */
exports.error = (err) => {
    console.error(err.stack)
}

exports.player = {}

/**
 * When a player clicks on the canvas
 */
exports.player.click = () => {
    console.log('Player clicked')
    // console.log('x: ' + x + ', y: ' + y)
}
