/**
 * Front-end game logic
 */

'use strict'

/* global Primus */

;(() => {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    const CANVAS_WIDTH = canvas.width // 901
    const CANVAS_HEIGHT = canvas.height // 601
    const CELL_WIDTH = 5
    const CELL_SPACE = 1
    const CELL_SIZE = CELL_WIDTH + CELL_SPACE
    const COLS = (CANVAS_WIDTH - CELL_SPACE) / CELL_SIZE // 150
    const ROWS = (CANVAS_HEIGHT - CELL_SPACE) / CELL_SIZE // 100
    const primus = new Primus()

    const GAME_EVENT = {
        STATE: 'game::state',
        PLAYER_COLOR: 'game::player::color',
        PLAYER_CLICK: 'game::player::click',
    }

    document.addEventListener('DOMContentLoaded', init)

    /**
     * Initialize game when the DOM is loaded
     */
    function init() {
        /**
         * When client connects to the server
         */
        primus.on('open', () => {
            console.log('Connected to server')
            canvas.addEventListener('click', handleCanvasClick)
        })

        /**
         * When new game state is received from the server
         */
        primus.on(GAME_EVENT.STATE, (gameState) => {
            console.log(`Received new game state from server at ${new Date()}`)
            drawWorld(gameState)
        })

        /**
         * When player's color is received from the server
         */
        primus.on(GAME_EVENT.PLAYER_COLOR, (color) => {
            console.log('Recieved player color from server')
            console.log(color)
            console.log('%c    ', `background: ${color}`)
        })
    }

    /**
     * Draws the world by iterating through each cell
     * Sets a light grey background which in tandem with cell spacing forms a grid
     *
     * @param {Number[]} cells - COLS * ROWS array of integer colors
     */
    function drawWorld(cells) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fillStyle = 'rgba(128, 128, 128, 0.15)'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                drawCell(x, y, cells[COLS * y + x])
            }
        }
    }

    /**
     * Draws a cell at the given coordinates with the given color
     *
     * @param {Number} x - x-coordinate of the cell
     * @param {Number} y - y-coordinate of the cell
     * @param {Number} cell - integer color of the cell
     */
    function drawCell(x, y, cell) {
        const color = integerToRgba(cell)
        ctx.fillStyle = color

        ctx.fillRect(
            x * CELL_SIZE + CELL_SPACE,
            y * CELL_SIZE + CELL_SPACE,
            CELL_WIDTH,
            CELL_WIDTH)
    }

    /**
     * Returns rgba CSS string for the color represented by signed 32 bit integer
     * Each of the 4 bytes represents r, g, b, a in little-endian byte order
     * Based on how Canvas API operates on pixel values
     *
     * @param {Number} integer - integer color of the cell
     * @returns {String} - CSS color in rgba format
     */
    function integerToRgba(integer) {
        const r = integer & 0xff
        const g = (integer >> 8) & 0xff
        const b = (integer >> 16) & 0xff
        const a = ((integer >> 24) & 0xff) / 255
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
    }

    /**
     * Click handler for canvas element
     */
    function handleCanvasClick(e) {
        let x = e.offsetX
        let y = e.offsetY

        // Adjust click coordinates 1px up and/or left if it falls on spacing
        // Because mouse cursors usually point in this direction
        if (x % CELL_SIZE === 0) x--
        if (y % CELL_SIZE === 0) y--

        x = Math.floor(x / CELL_SIZE)
        y = Math.floor(y / CELL_SIZE)

        primus.emit(GAME_EVENT.PLAYER_CLICK, { x, y })
    }
})()
