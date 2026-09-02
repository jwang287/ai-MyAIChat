import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())

vi.mock('electron', () => ({ net: { fetch: fetchMock } }))

vi.mock('@logger', () => ({
  loggerService: {
    withContext: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}))

const { fetchKnowledgeWebPage } = await import('../url')

function response(url: string, content: string, title: string = url) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: { title, content } })
  }
}

function fetchedPage(url: string, markdown: string, title: string = url) {
  return { title, markdown }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('fetchKnowledgeWebPage', () => {
  beforeEach(() => {
    vi.useRealTimers()
    fetchMock.mockReset()
  })

  it('retrieves Jina Reader markdown for a knowledge URL', async () => {
    fetchMock.mockResolvedValue(response('https://example.com', '# Example Page\n\nHello knowledge', 'Example Page'))

    await expect(fetchKnowledgeWebPage('https://example.com')).resolves.toEqual(
      fetchedPage('https://example.com', '# Example Page\n\nHello knowledge', 'Example Page')
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://r.jina.ai/https://example.com',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) })
    )
  })

  it('rejects before execution when the caller signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort(new Error('fetch aborted'))

    await expect(fetchKnowledgeWebPage('https://example.com', controller.signal)).rejects.toThrow('fetch aborted')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('propagates Jina Reader HTTP failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })

    await expect(fetchKnowledgeWebPage('https://example.com')).rejects.toThrow('Knowledge URL fetch failed: HTTP 500')
  })

  it('rejects unsupported protocols before dispatching the request', async () => {
    await expect(fetchKnowledgeWebPage('file:///etc/passwd')).rejects.toThrow(
      'Invalid knowledge url: file:///etc/passwd'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limits concurrent knowledge URL retrievals through a shared queue', async () => {
    let activeFetches = 0
    let maxActiveFetches = 0
    const deferredResponses = Array.from({ length: 5 }, () => createDeferred<ReturnType<typeof response>>())
    let fetchCallIndex = 0

    fetchMock.mockImplementation(async () => {
      const deferred = deferredResponses[fetchCallIndex++]
      if (!deferred) throw new Error('Unexpected fetch call')
      activeFetches += 1
      maxActiveFetches = Math.max(maxActiveFetches, activeFetches)
      try {
        return await deferred.promise
      } finally {
        activeFetches -= 1
      }
    })

    const requests = [1, 2, 3, 4, 5].map((id) => fetchKnowledgeWebPage(`https://example.com/${id}`))
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(activeFetches).toBe(3)
    })

    deferredResponses[0].resolve(response('https://example.com/1', 'page 1'))
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
    deferredResponses
      .slice(1)
      .forEach((deferred, index) => deferred.resolve(response(`https://example.com/${index + 2}`, `page ${index + 2}`)))

    await expect(Promise.all(requests)).resolves.toEqual(
      [1, 2, 3, 4, 5].map((id) => fetchedPage(`https://example.com/${id}`, `page ${id}`))
    )
    expect(maxActiveFetches).toBeLessThanOrEqual(3)
  })

  it('does not start the timeout for a request still waiting in the queue', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    const deferredResponses = Array.from({ length: 4 }, () => createDeferred<ReturnType<typeof response>>())
    let fetchCallIndex = 0
    fetchMock.mockImplementation(() => deferredResponses[fetchCallIndex++].promise)

    const activeRequests = [1, 2, 3].map((id) => fetchKnowledgeWebPage(`https://example.com/${id}`))
    const queuedController = new AbortController()
    const queuedRequest = fetchKnowledgeWebPage('https://example.com/4', queuedController.signal)
    void queuedRequest.catch(() => undefined)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    expect(timeoutSpy).toHaveBeenCalledTimes(3)

    queuedController.abort(new Error('queued abort'))
    deferredResponses
      .slice(0, 3)
      .forEach((deferred, index) => deferred.resolve(response(`https://example.com/${index + 1}`, `page ${index + 1}`)))

    await expect(Promise.all(activeRequests)).resolves.toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    timeoutSpy.mockRestore()
  })
})
