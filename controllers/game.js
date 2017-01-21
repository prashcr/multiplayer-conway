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
const BLANK_CELL = -1 // white color as an integer

// Array of integer colors that is pushed to clients
const colorState = new Array(cols * rows).fill(BLANK_CELL)
// Array of 1's or 0's, corresponding to whether the cell is alive or not
let gameState = new Array(cols * rows).fill(0)
let timeoutId

module.exports = (primus) => {
    /**
     * When a new connection is received
     */
    function connection(spark) {
        const req = spark.request

        if (!req.session.color) {
            req.session.color = randomColor({ format: 'rgb', luminosity: 'dark' })
            req.session.save()
        }
        const integerColor = rgbaToInteger(req.session.color)

        spark.emit('game::player::color', req.session.color)
        spark.emit('game::state', colorState)

        spark.on('game::player::click', playerClick(integerColor))
    }

    /**
     * When a player clicks on the canvas
     */
    function playerClick(integerColor) {
        return function handleClick({ x, y }) {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(gameTick, 2000)

            colorState[cols * y + x] = integerColor
            gameState[cols * y + x] = 1

            primus.forEach(spark => spark.emit('game::state', colorState))
        }
    }

    /**
     * Runs Game of Life algorithm every X milliseconds
     */
    function gameTick() {
        const nextGameState = new Array(cols * rows).fill(0)

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const result = countNeighbors(x, y)

                // Any live cell with fewer than two live neighbours dies,
                // as if caused by under-population.
                if (result.neighbors < 2 && gameState[cols * y + x] === 1) {
                    colorState[cols * y + x] = BLANK_CELL
                    nextGameState[cols * y + x] = 0
                }

                // Any live cell with two or three live neighbours lives on to the next generation.
                if ((result.neighbors === 2 || result.neighbors === 3) &&
                gameState[cols * y + x] === 1) {
                    nextGameState[cols * y + x] = 1
                }

                // Any live cell with more than three live neighbours dies, as if by overcrowding.
                if (result.neighbors > 3 && gameState[cols * y + x] === 1) {
                    colorState[cols * y + x] = BLANK_CELL
                    nextGameState[cols * y + x] = 0
                }

                // Any dead cell with exactly three live neighbours becomes a live cell,
                // as if by reproduction.
                if (result.neighbors === 3 && gameState[cols * y + x] === 0) {
                    console.log(result.indexes)
                    colorState[cols * y + x] = -23523356
                    nextGameState[cols * y + x] = 1
                }
            }
        }

        gameState = nextGameState

        primus.forEach(spark => spark.emit('game::state', colorState))

        timeoutId = setTimeout(gameTick, 1000)
    }

    gameTick()

    return {
        connection,
        error,
    }
}

/**
 * When an error occurs
 */
function error(err) {
    console.error(err.stack)
}

/**
 * Returns a cell value, which is a Number
 * Least significant 4 bytes contains rgba color value
 *
 * @param {String} rgba      CSS color of the cell either in rgb or rgba format
 */
function rgbaToInteger(rgba) {
    const startIndex = rgba[3] === 'a' ? 5 : 4
    const values = rgba.slice(startIndex, -1).split(',').map(n => parseInt(n, 10))
    const [r, g, b] = values
    const a = values[3] === undefined ? 255 : Math.round(values[3] * 255)

    return (a << 24) |
        (b << 16) |
        (g << 8) |
        r
}

/**
 * Copied from front-end code to calculate color of revived cells
 *
 * Returns rgba CSS string for the color represented by least significant 4 bytes of cell value
 * Assumes little-endian byte order
 * Inspired by https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
 *
 * @param {Number} integer   integer color of the cell
 */
function integerToRgba(integer) {
    const r = integer & 0xff
    const g = (integer >> 8) & 0xff
    const b = (integer >> 16) & 0xff
    const a = ((integer >> 24) & 0xff) / 255
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

/**
 * Returns number of live neighbors for a given cell, and the indexes of the neighbors
 * The world is toriodal (edges wrap around)
 */
function countNeighbors(x, y) {
    const indexes = []
    let count = 0
    let nx
    let ny

    // NorthWest neighbor
    ny = y - 1 < 0 ? rows - 1 : y - 1
    nx = x - 1 < 0 ? cols - 1 : x - 1
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // North neighbor
    nx = x
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // NorthEast neighbor
    nx = x + 1 === cols ? 0 : x + 1
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // East neighbor
    ny = y
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // West neighbor
    nx = x - 1 < 0 ? cols - 1 : x - 1
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // SouthWest neighbor
    ny = y + 1 === rows ? 0 : y + 1
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // South neighbor
    nx = x
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    // SouthEast neighbor
    nx = x + 1 === cols ? 0 : x + 1
    count += gameState[cols * ny + nx]
    if (gameState[cols * ny + nx] === 1) {
        indexes.push(cols * ny + nx)
    }

    return { count, indexes }
}
