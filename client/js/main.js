const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const canvasWidth = canvas.width
const canvasHeight = canvas.height
const cellWidth = 5
const cellSpace = 1
const cellSize = cellWidth + cellSpace
const gridWidth = canvasWidth - cellSpace
const gridHeight = canvasHeight - cellSpace

ctx.fillStyle = 'rgba(32, 32, 32, 0.08)'
ctx.fillRect(0, 0, canvasWidth, canvasHeight)
ctx.fillStyle = '#FFFFFF'

for (let y = 0; y < gridHeight; y += cellSize) {
    for (let x = 0; x < gridWidth; x += cellSize) {
        ctx.fillRect(x + cellSpace, y + cellSpace, cellWidth, cellWidth)
    }
}
