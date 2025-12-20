import ERROR_CODES from './error-codes.js'

/**
 * @typedef {Object} rpcExceptionPayload
 * @property {ERROR_CODES} [code=ERROR_CODES.UNKNOWN] - Error code
 * @property {string} [message="Unexpected error occurred"] - Error message
 * @property {any} error - Original exception itself
 */

/**
 * @typedef {Object} rpcExceptionResponse
 * @property {ERROR_CODES} code - Error code
 * @property {string} message - Error message
 * @property {string} error - Original exception converted to string
 */

function stringifyError (error) {
  if (error instanceof Error) {
    return `${error.message}: ${error.stack}`
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/**
 * Converts an error payload to a JSON string representing a rpcExceptionResponse.
 *
 * @param {rpcExceptionPayload} payload
 * @returns {string} JSON string of rpcExceptionResponse object.
 * @see rpcExceptionResponse
 */
function rpcException (payload) {
  return {
    code: payload.code ? payload.code : ERROR_CODES.UNKNOWN,
    message: payload.message ? payload.message : 'Unexpected error occurred.',
    error: stringifyError(payload.error)
  }
}

export {
  rpcException,
  stringifyError
}
