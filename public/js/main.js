'use strict'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const canvasWidth = canvas.width
const canvasHeight = canvas.height
const cellWidth = 5
const cellSpace = 1
const cellSize = cellWidth + cellSpace
const cols = (canvasWidth - cellSpace) / cellSize
const rows = (canvasHeight - cellSpace) / cellSize
const state = new Array(cols * rows).fill(-1)

/**
 * Returns rgba CSS string for the color represented by a 32bit int
 * Assumes little-endian byte order
 * Inspired by https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
 * @param {int} value 32bit int containing rgba color value of the cell
 */
function getCssColor(value) {
    const r = value & 0xff
    const g = (value >> 8) & 0xff
    const b = (value >> 16) & 0xff
    const a = ((value >> 24) & 0xff) / 255
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

/**
 * Draws a cell at the given coordinates with the given color
 * @param {int} x      x-coordinate of the cell
 * @param {int} y      y-coordinate of the cell
 * @param {int} color  32bit int containing rgba color value of the cell
 */
function drawCell(x, y, color) {
    ctx.fillStyle = getCssColor(color)

    ctx.fillRect(
        x * cellSize + cellSpace,
        y * cellSize + cellSpace,
        cellWidth,
        cellWidth)
}

/**
 * Draws the world by iterating through each cell
 * Sets a light grey background which in tandem with cell spacing forms a grid
 * @param {int[]} cells cols x rows array of 32bit ints containing rgba color for each cell
 */
function drawWorld(cells) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = 'rgba(24, 24, 24, 0.15)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            drawCell(x, y, cells[cols * y + x])
        }
    }
}

/**
 * Returns random integer between and including min, max
 * @param {int} min
 * @param {int} max
 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Click handler for canvas element
 */
function handleCanvasClick(e) {
    console.log('x:' + e.offsetX + ', y:' + e.offsetY)
    let x = e.offsetX
    let y = e.offsetY

    // Adjust click coordinates up and/or left if it falls on spacing
    // Because mouse cursors usually point in this direction
    if (x % cellSize === 0) x--
    if (y % cellSize === 0) y--

    x = Math.floor(x / cellSize)
    y = Math.floor(y / cellSize)

    state[cols * y + x] = -2147483393
    drawWorld(state)
}

/**
 * Perform initialization tasks
 */
function init() {
    canvas.addEventListener('click', handleCanvasClick)
    drawWorld(state)
}

document.addEventListener('DOMContentLoaded', init)
