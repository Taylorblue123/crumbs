import { http, HttpResponse, delay } from 'msw'

const MOCK_RESPONSE = {
  mbti: ['INTJ', 'ENFP', 'ISTP'] as [string, string, string],
  description: [
    'The strategist who overthinks brunch orders.',
    'Chaos gremlin with a spreadsheet problem.',
    'Silently judging your playlist from the corner.',
  ] as [string, string, string],
  thoughts: [
    '今天又在厕所里开会了，觉得自己像个会议室里的游魂。',
    'Maybe productivity is just procrastination with better branding.',
    '我不是内向，我只是在加载。',
  ] as [string, string, string],
}

// Minimal valid MP4 file (1x1 black frame, ~0.1s)
// Generated from a real ffmpeg encode, base64'd
const MINIMAL_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrQYF//+p' +
  '3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzE5OCBhZjFjNTU3IC0gSC4yNjQvTVBF' +
  'Ry00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4u' +
  'b3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFs' +
  'eXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVk' +
  'X3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBk' +
  'ZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEg' +
  'bG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRl' +
  'cmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJf' +
  'cHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9' +
  'MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3Jl' +
  'ZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAu' +
  'NjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAA' +
  'DmWIhAAz//727L4FNf2f0teleGGMBAAAAwAAAwAAAwAAAwAAAwDyAAJoAAAACEGaJGxBDwAFgAAA' +
  'AARBmkRsQQ8ABQAAAARBmmRsQQ8ABYAAAAdtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAA' +
  'KAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACaHRyYWsAAABcdGtoZAAAAA8AAAAAAAAAAAAAAAEAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAABAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAHRYA2FyAAABPHN0YmwAAACYc3RzZAAAAAAAAACIdWR0YQAAAAAAZG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAJWlsc3QAAAAdqW5hbQAAABVkYXRhAAAAAQAAAABAAAAAt3N0YmwAAABbc3RzZAAAAAAAAAABAAAAS2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAAQBIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBZAAf/+EAF2dkAB+s2UBQBboQAAADABAAAAMAkPGDkgEABmjr48siwAAAARhzdHRzAAAAAAAAAAEAAAABAAAoAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAALAAAAAQAAABRzdGNvAAAAAAAAAAEAAAAw'

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export const handlers = [
  http.post('/api/upload', async () => {
    await delay(3000)
    return HttpResponse.json(MOCK_RESPONSE)
  }),

  http.get('/api/generate', () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate progress events
        const events = [
          { event: 'progress', data: { status: 'creating', attempt: 0, elapsed_s: 0 } },
          { event: 'progress', data: { status: 'running', attempt: 1, elapsed_s: 3 } },
          { event: 'progress', data: { status: 'running', attempt: 2, elapsed_s: 6 } },
          { event: 'done', data: { video_url: '/__mock_video__' } },
        ]
        for (const e of events) {
          await delay(1000)
          controller.enqueue(encoder.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`))
        }
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }),

  http.get('/api/generate/video', async () => {
    await delay(500)
    try {
      const buf = base64ToArrayBuffer(MINIMAL_MP4_BASE64)
      return new HttpResponse(buf, {
        headers: { 'Content-Type': 'video/mp4' },
      })
    } catch {
      return new HttpResponse(new ArrayBuffer(0), {
        headers: { 'Content-Type': 'video/mp4' },
      })
    }
  }),
]
