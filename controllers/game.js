/**
 * Back-end Primus code
 */

'use strict'

exports.connection = (spark) => {
    spark.write('Connected to server')
}

exports.error = (err) => {
    console.error(err.stack)
}
