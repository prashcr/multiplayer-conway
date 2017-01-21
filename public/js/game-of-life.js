/**
 * Front-end game logic
 */

'use strict'

/* global Primus */

;(() => {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    const canvasWidth = canvas.width // 901
    const canvasHeight = canvas.height // 601
    const cellWidth = 5
    const cellSpace = 1
    const cellSize = cellWidth + cellSpace
    const cols = (canvasWidth - cellSpace) / cellSize // 150
    const rows = (canvasHeight - cellSpace) / cellSize // 100
    const primus = new Primus()

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
        primus.on('game::state', (gameState) => {
            console.log(`Received new game state from server at ${new Date()}`)
            drawWorld(gameState)
        })

        /**
         * When player's color is received from the server
         */
        primus.on('game::player::color', (color) => {
            console.log('Recieved player color from server')
            console.log(color)
            console.log('%c    ', `background: ${color}`)
        })
    }

    /**
     * Draws the world by iterating through each cell
     * Sets a light grey background which in tandem with cell spacing forms a grid
     *
     * @param {Number[]} cells cols * rows array of integer colors
     */
    function drawWorld(cells) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        ctx.fillStyle = 'rgba(128, 128, 128, 0.15)'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                drawCell(x, y, cells[cols * y + x])
            }
        }
    }

    /**
     * Draws a cell at the given coordinates with the given color
     *
     * @param {Number} x          integer x-coordinate of the cell
     * @param {Number} y          integer y-coordinate of the cell
     * @param {Number} cell       integer color of the cell
     */
    function drawCell(x, y, cell) {
        const color = integerToRgba(cell)
        ctx.fillStyle = color

        ctx.fillRect(
            x * cellSize + cellSpace,
            y * cellSize + cellSpace,
            cellWidth,
            cellWidth)
    }

    /**
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
     * Click handler for canvas element
     */
    function handleCanvasClick(e) {
        let x = e.offsetX
        let y = e.offsetY

        // Adjust click coordinates 1px up and/or left if it falls on spacing
        // Because mouse cursors usually point in this direction
        if (x % cellSize === 0) x--
        if (y % cellSize === 0) y--

        x = Math.floor(x / cellSize)
        y = Math.floor(y / cellSize)

        primus.emit('game::player::click', { x, y })
    }
})()
