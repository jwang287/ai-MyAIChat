import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelV3CallOptions } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'

import { normalizeArkResponsesResponse } from '../ark'

const prompt: LanguageModelV3CallOptions['prompt'] = [{ role: 'user', content: [{ type: 'text', text: 'Say hi.' }] }]

const arkResponseBody = {
  id: 'resp_ark',
  created_at: 1786440279,
  model: 'doubao-seed-2-0-code-preview-260215',
  output: [
    {
      type: 'message',
      role: 'assistant',
      id: 'msg_ark',
      content: [{ type: 'output_text', text: 'Hi there!' }]
    }
  ],
  service_tier: 'default',
  usage: {
    input_tokens: 3,
    input_tokens_details: { cached_tokens: 0 },
    output_tokens: 2,
    output_tokens_details: { reasoning_tokens: 0 }
  }
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-request-id': 'ark-request' }
  })

describe('normalizeArkResponsesResponse', () => {
  it('lets the OpenAI Responses parser consume Ark output_text without annotations', async () => {
    const model = createOpenAI({
      apiKey: 'sk-test',
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      fetch: async (input) => normalizeArkResponsesResponse(input, jsonResponse(arkResponseBody))
    }).responses('doubao-seed-2-0-code-preview-260215')

    const result = await model.doGenerate({ prompt })

    expect(result.content).toContainEqual(expect.objectContaining({ type: 'text', text: 'Hi there!' }))
  })

  it('keeps an existing annotations array and the original response', async () => {
    const annotations = [
      {
        type: 'url_citation',
        start_index: 0,
        end_index: 9,
        url: 'https://example.com',
        title: 'Example'
      }
    ]
    const response = jsonResponse({
      ...arkResponseBody,
      output: [
        {
          ...arkResponseBody.output[0],
          content: [{ ...arkResponseBody.output[0].content[0], annotations }]
        }
      ]
    })

    const normalized = await normalizeArkResponsesResponse(
      'https://ark.cn-beijing.volces.com/api/v3/responses',
      response
    )

    expect(normalized).toBe(response)
    expect((await normalized.json()).output[0].content[0].annotations).toEqual(annotations)
  })

  it('preserves response metadata without stale compressed-body headers', async () => {
    const response = new Response(JSON.stringify(arkResponseBody), {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-encoding': 'gzip',
        'content-length': '1786',
        'x-request-id': 'ark-request'
      }
    })

    const normalized = await normalizeArkResponsesResponse(
      'https://ark.cn-beijing.volces.com/api/v3/responses',
      response
    )

    expect(normalized.status).toBe(200)
    expect(normalized.statusText).toBe('OK')
    expect(normalized.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(normalized.headers.get('x-request-id')).toBe('ark-request')
    expect(normalized.headers.has('content-encoding')).toBe(false)
    expect(normalized.headers.has('content-length')).toBe(false)
  })

  it.each([
    {
      name: 'streaming responses',
      url: 'https://ark.cn-beijing.volces.com/api/v3/responses',
      response: () => new Response('data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } })
    },
    {
      name: 'other endpoints',
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      response: () => jsonResponse(arkResponseBody)
    },
    {
      name: 'failed responses',
      url: 'https://ark.cn-beijing.volces.com/api/v3/responses',
      response: () => jsonResponse({ error: { message: 'bad request' } }, 400)
    },
    {
      name: 'invalid JSON',
      url: 'https://ark.cn-beijing.volces.com/api/v3/responses',
      response: () => new Response('not-json', { headers: { 'content-type': 'application/json' } })
    }
  ])('passes through $name', async ({ url, response: createResponse }) => {
    const response = createResponse()

    expect(await normalizeArkResponsesResponse(url, response)).toBe(response)
  })
})
