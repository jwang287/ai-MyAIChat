/**
 * Whether a string parses as an absolute `http(s)` URL.
 *
 * Lives in `shared` so all URL-consuming features apply the same protocol
 * validation before attempting a fetch.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
