export type rpcExceptionPayload = {
    /**
     * - Error code
     */
    code?: ERROR_CODES;
    /**
     * - Error message
     */
    message?: string;
    /**
     * - Original exception itself
     */
    error: any;
};
export type rpcExceptionResponse = {
    /**
     * - Error code
     */
    code: ERROR_CODES;
    /**
     * - Error message
     */
    message: string;
    /**
     * - Original exception converted to string
     */
    error: string;
};
/**
 * Converts an error payload to a JSON string representing a rpcExceptionResponse.
 *
 * @param {rpcExceptionPayload} payload
 * @returns {string} JSON string of rpcExceptionResponse object.
 * @see rpcExceptionResponse
 */
export function rpcException(payload: rpcExceptionPayload): string;
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
export function stringifyError(error: any): string;
import ERROR_CODES from './error-codes.js';
