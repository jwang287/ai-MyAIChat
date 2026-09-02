type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isResponsesRequest(input: RequestInfo | URL): boolean {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  try {
    return new URL(target).pathname.replace(/\/+$/, '').endsWith('/responses')
  } catch {
    return false
  }
}

function addMissingOutputTextAnnotations(value: unknown): unknown {
  if (!isJsonObject(value) || !Array.isArray(value.output)) return value

  let outputChanged = false
  const output = value.output.map((item) => {
    if (!isJsonObject(item) || item.type !== 'message' || !Array.isArray(item.content)) return item

    let contentChanged = false
    const content = item.content.map((part) => {
      if (
        !isJsonObject(part) ||
        part.type !== 'output_text' ||
        Object.prototype.hasOwnProperty.call(part, 'annotations')
      ) {
        return part
      }

      contentChanged = true
      return { ...part, annotations: [] }
    })

    if (!contentChanged) return item
    outputChanged = true
    return { ...item, content }
  })

  return outputChanged ? { ...value, output } : value
}

export async function normalizeArkResponsesResponse(input: RequestInfo | URL, response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type')?.toLowerCase()
  if (!response.ok || !isResponsesRequest(input) || contentType?.includes('text/event-stream')) return response

  try {
    const json: unknown = await response.clone().json()
    const normalized = addMissingOutputTextAnnotations(json)
    if (normalized === json) return response

    const headers = new Headers(response.headers)
    headers.delete('content-encoding')
    headers.delete('content-length')

    return new Response(JSON.stringify(normalized), {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch {
    return response
  }
}
