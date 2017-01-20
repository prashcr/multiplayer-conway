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

module.exports = (primus) => {
    setInterval(worldTick, 1000)

    return {
        connection,
        error,
    }

    /**
     * When a new connection is received
     */
    function connection(spark) {
        const req = spark.request

        if (!req.session.color) {
            req.session.color = randomColor({ format: 'rgb' })
            req.session.save()
        }
        const integerColor = rgbaToInteger(req.session.color)

        spark.emit('game::player::color', req.session.color)
        spark.emit('game::state', gameState)

        /**
         * When a player clicks on the canvas
         */
        spark.on('game::player::click', ({ x, y }) => {
            gameState[cols * y + x] = integerColor
            primus.forEach(eachSpark => eachSpark.emit('game::state', gameState))
        })
    }

    /**
     * When an error occurs
     */
    function error(err) {
        console.error(err.stack)
    }

    /**
     * Runs Game of Life algorithm every X milliseconds
     */
    function worldTick() {
        // TODO Game of Life logic
    }
}

/**
 * Takes an rgb(a) CSS string and returns it as an integer
 *  @param {String} rgba CSS color either in rgb or rgba format
 */
function rgbaToInteger(rgba) {
    const startIndex = rgba[3] === 'a' ? 5 : 4
    const values = rgba.slice(startIndex, -1).split(',').map(n => parseInt(n, 10))
    const [r, g, b] = values
    const a = values[3] ? Math.round(values[3] * 255) : 255

    return (a << 24) |
           (b << 16) |
           (g << 8) |
           r
}
