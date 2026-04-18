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

export const handlers = [
  http.post('/api/upload', async () => {
    await delay(3000)
    return HttpResponse.json(MOCK_RESPONSE)
  }),

  http.get('/api/generate', async () => {
    await delay(3000)
    // Return a tiny valid mp4 placeholder — in real app this would be a generated video
    // For demo, we'll return a blob that the video element can attempt to play
    const res = await fetch('/avatars/intj.png')
    const blob = await res.blob()
    return new HttpResponse(blob, {
      headers: { 'Content-Type': 'video/mp4' },
    })
  }),
]
