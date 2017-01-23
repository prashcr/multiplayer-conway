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
 * Also makes it easy to choose dark colors which is ideal for our white background
 * tl;dr pretty colors
 */
const randomColor = require('randomcolor')

const COLS = 150
const ROWS = 100

const COLOR = {
    BLANK: -1, // white
}

const LIFE = {
    ALIVE: 1,
    DEAD: 0,
}

const GAME_EVENT = {
    STATE: 'game::state',
    PLAYER_COLOR: 'game::player::color',
    PLAYER_CLICK: 'game::player::click',
}

const GAME_TICK_INTERVAL = {
    DEFAULT: 1000,
    AFTER_CLICK: 2500,
}

/**
 * Game factory to encapsulate game state and its operations
 *
 * @returns {Object} - game object containing functions for game state operations
 */
const Game = function Game() {
    const colors = new Array(COLS * ROWS).fill(COLOR.BLANK)
    let lives = new Array(COLS * ROWS).fill(LIFE.DEAD)

    /**
     * Returns color of cell at x,y
     *
     * @param {Number} x - x-coordinate of cell
     * @param {Number} y - y-coordinate of cell
     * @returns {Number} - integer color of cell at x,y
     */
    function getColor(x, y) {
        return colors[COLS * y + x]
    }

    /**
     * Returns entire array of colors for all cells
     *
     * @returns {Number[]} - integer colors for all cells
     */
    function getColors() {
        return colors
    }

    /**
     * Sets color of cell at x,y
     *
     * @param {Number} x - x-coordinate of cell
     * @param {Number} y - y-coordinate of cell
     * @param {Number} color - integer color of cell
     */
    function setColor(x, y, color) {
        colors[COLS * y + x] = color
    }

    /**
     * Returns life of cell at x,y
     *
     * @param {Number} x - x-coordinate of cell
     * @param {Number} y - y-coordinate of cell
     * @returns {Number} - life value of cell
     */
    function getLife(x, y) {
        return lives[COLS * y + x]
    }

    /**
     * Sets life of cell at x,y
     *
     * @param {Number} x - x-coordinate of cell
     * @param {Number} y - y-coordinate of cell
     * @param {Number} life - life value of cell
     */
    function setLife(x, y, life) {
        lives[COLS * y + x] = life
    }

    /**
     * Replaces lives state with a new one
     *
     * @param {Number[]} newLivesState - array of life values to replace the current one with
     */
    function setLives(newLivesState) {
        lives = newLivesState
    }

    return {
        getColor,
        getColors,
        setColor,
        getLife,
        setLife,
        setLives,
    }
}

const game = Game()

// Stores current gameTick() timeoutId
let gameTickTimeoutId

module.exports = (primus) => {
    /**
     * When a new connection is received
     *
     * @param {Spark} spark - spark object from Primus
     */
    function connection(spark) {
        const req = spark.request

        if (!req.session.color) {
            req.session.color = randomColor({ format: 'rgb', luminosity: 'dark' })
            req.session.save()
        }
        const color = rgbaToInteger(req.session.color)

        spark.emit(GAME_EVENT.PLAYER_COLOR, req.session.color)
        spark.emit(GAME_EVENT.STATE, game.getColors())

        spark.on(GAME_EVENT.PLAYER_CLICK, playerClick.bind(null, color))
    }

    /**
     * When player clicks the canvas
     * Resets gameTick timeout to avoid interrupting player while they are clicking cells
     * If the clicked cell is dead, makes it alive and gives it the player's color
     *
     * @param {Number} color - player's color
     * @param {Number} x - x-coordinate of cell
     * @param {Number} y - y-coordinate of cell
     */
    function playerClick(color, { x, y }) {
        clearTimeout(gameTickTimeoutId)
        gameTickTimeoutId = setTimeout(gameTick, GAME_TICK_INTERVAL.AFTER_CLICK)

        if (game.getLife(x, y) === LIFE.DEAD) {
            game.setColor(x, y, color)
            game.setLife(x, y, LIFE.ALIVE)

            primus.forEach(spark => spark.emit(GAME_EVENT.STATE, game.getColors()))
        }
    }

    /**
     * Runs Game of Life algorithm every X milliseconds
     * Uses setTimeout to allow for dynamic interval logic
     * e.g. pending timeout is reset and longer interval is applied when a player clicks on the game
     */
    function gameTick() {
        const nextLivesState = new Array(COLS * ROWS).fill(LIFE.DEAD)

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const { count, colors } = countNeighbors(x, y)

                // Any live cell with fewer than two live neighbours dies,
                // as if caused by under-population.
                if (count < 2 && game.getLife(x, y) === LIFE.ALIVE) {
                    game.setColor(x, y, COLOR.BLANK)
                    nextLivesState[COLS * y + x] = LIFE.DEAD
                }

                // Any live cell with two or three live neighbours lives on to the next generation.
                if ((count === 2 || count === 3) &&
                game.getLife(x, y) === LIFE.ALIVE) {
                    nextLivesState[COLS * y + x] = LIFE.ALIVE
                }

                // Any live cell with more than three live neighbours dies, as if by overcrowding.
                if (count > 3 && game.getLife(x, y) === LIFE.ALIVE) {
                    game.setColor(x, y, COLOR.BLANK)
                    nextLivesState[COLS * y + x] = LIFE.DEAD
                }

                // Any LIFE.DEAD cell with exactly three live neighbours becomes a live cell,
                // as if by reproduction.
                if (count === 3 && game.getLife(x, y) === LIFE.DEAD) {
                    game.setColor(x, y, -23523356)
                    nextLivesState[COLS * y + x] = LIFE.ALIVE
                }
            }
        }

        game.setLives(nextLivesState)

        primus.forEach(spark => spark.emit(GAME_EVENT.STATE, game.getColors()))

        gameTickTimeoutId = setTimeout(gameTick, GAME_TICK_INTERVAL.DEFAULT)
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
 * Returns a color, which is a 32 bit signed integer
 * Each of the 4 bytes represents r, g, b, a in little-endian byte order
 * Based on how Canvas API operates on pixel values
 *
 * @param {String} rgba - CSS color of the cell either in rgb or rgba format
 * @returns {Number} - integer color of the cell
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
 * Returns rgba array for the integer color
 *
 * @param {Number} color - integer color of the cell
 * @returns {Number[]} - array of r,g,b,a values
 */
function integerToRgbaArray(color) {
    const r = color & 0xff
    const g = (color >> 8) & 0xff
    const b = (color >> 16) & 0xff
    const a = ((color >> 24) & 0xff) / 255
    return [r, g, b, a]
}


/**
 * Returns number of live neighbors for a given cell and colors of alive neighbors
 * There's some indexing arithmetic to make the world toroidal (opposite edges are connected)
 *
 * @param {Number} x - x-coordinate
 * @param {Number} y - y-coordinate
 * @return {Number} count - number of alive neighbors
 * @return {Number[]} colors - colors of all live neighbors
 */
function countNeighbors(x, y) {
    const colors = []
    let count = 0
    let nx
    let ny

    // NorthWest neighbor
    ny = y - 1 < 0 ? ROWS - 1 : y - 1
    nx = x - 1 < 0 ? COLS - 1 : x - 1
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // North neighbor
    nx = x
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // NorthEast neighbor
    nx = x + 1 === COLS ? 0 : x + 1
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // East neighbor
    ny = y
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // West neighbor
    nx = x - 1 < 0 ? COLS - 1 : x - 1
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // SouthWest neighbor
    ny = y + 1 === ROWS ? 0 : y + 1
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // South neighbor
    nx = x
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    // SouthEast neighbor
    nx = x + 1 === COLS ? 0 : x + 1
    count += game.getLife(nx, ny)
    if (game.getLife(nx, ny) === LIFE.ALIVE) {
        colors.push(game.getColor(x, y))
    }

    return { count, colors }
}
