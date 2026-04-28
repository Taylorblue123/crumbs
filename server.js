import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { OCR_PROMPT, ANALYSIS_PROMPT, videoPromptPrompt } from './prompts.js';

const execFileP = promisify(execFile);

const N_FRAMES = 20;

const FFMPEG_BIN = process.env.FFMPEG_BIN || 'ffmpeg';
const FFPROBE_BIN = process.env.FFPROBE_BIN || 'ffprobe';

const FFMPEG_ROOT = process.env.FFMPEG_ROOT;
let FF_ENV = { ...process.env };
if (FFMPEG_ROOT) {
  const DYLD_PATH = [
    'libavfilter', 'libavutil', 'libavdevice', 'libavformat',
    'libswscale', 'libavcodec', 'libswresample',
  ].map((d) => path.join(FFMPEG_ROOT, d)).join(':');
  FF_ENV.DYLD_LIBRARY_PATH = DYLD_PATH;
  FF_ENV.DYLD_FALLBACK_LIBRARY_PATH = DYLD_PATH;
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// --- Daily counter ---
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
function readStats() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); }
  catch { return { count: 0, date: '' }; }
}
function bumpStats() {
  const today = new Date().toISOString().slice(0, 10);
  const stats = readStats();
  if (stats.date !== today) { stats.count = 0; stats.date = today; }
  stats.count++;
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats));
  return stats;
}

const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

const VISION_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = readStats();
  res.json({ count: stats.date === today ? stats.count : 0 });
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
  console.log('[upload] request:', req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'no video file' });
  }
  let framesDir = null;
  try {
    const { stdout } = await execFileP(FFPROBE_BIN, [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate,nb_frames:format=duration',
      '-of', 'default=noprint_wrappers=1',
      req.file.path,
    ], { env: FF_ENV });
    console.log('[upload] ffprobe output:', stdout);
    const kv = Object.fromEntries(
      stdout.trim().split('\n').map((l) => l.split('=')),
    );
    const duration = parseFloat(kv.duration);
    const [fpsNum, fpsDen] = kv.r_frame_rate.split('/').map(Number);
    const fps = fpsNum / fpsDen;
    if (!isFinite(duration) || duration <= 0 || !isFinite(fps) || fps <= 0) {
      return res.status(400).json({ error: 'could not probe video' });
    }
    const totalFrames = Math.floor(duration * fps);
    const lo = Math.floor(totalFrames * 0.2);
    const hi = Math.floor(totalFrames * 0.8);
    const rangeSize = hi - lo;
    const n = Math.min(N_FRAMES, rangeSize);
    console.log('[upload] n:', n);

    const picked = new Set();
    while (picked.size < n) {
      picked.add(lo + Math.floor(Math.random() * rangeSize));
    }
    const indices = [...picked].sort((a, b) => a - b);

    console.log('[upload] picked indices:', indices);
    const jobId = randomUUID();
    framesDir = path.join(DATA_DIR, jobId);
    fs.mkdirSync(framesDir, { recursive: true });

    const selectExpr = indices.map((i) => `eq(n\\,${i})`).join('+');
    await execFileP(FFMPEG_BIN, [
      '-v', 'error',
      '-i', req.file.path,
      '-vf', `select='${selectExpr}',scale=iw/2:ih/2`,
      '-fps_mode', 'vfr',
      path.join(framesDir, 'frame-%06d.png'),
    ], { env: FF_ENV });

    const frames = fs.readdirSync(framesDir).sort();
    console.log('[upload] frames:', frames);
    const results = await Promise.all(frames.map(async (fname) => {
      const fpath = path.join(framesDir, fname);
      const b64 = fs.readFileSync(fpath).toString('base64');
      const completion = await openai.chat.completions.create({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: OCR_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        }],
      });
      return { frame: fname, text: completion.choices[0]?.message?.content ?? '' };
    }));
    console.log('[upload] results:', results.length);
    
    const concatenated = results.map((r) => r.text).join('\n\n---\n\n');
    const analysis = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: 'user', content: `${ANALYSIS_PROMPT}\n\n---\n\n${concatenated}` },
      ],
    });
    const analysisText = analysis.choices[0]?.message?.content ?? '';

    console.log('[upload]', {
      jobId,
      duration,
      fps,
      totalFrames,
      pickedIndices: indices,
      framesDir,
      frameCount: frames.length,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
    });
    console.log('[ocr]', results);
    console.log('[concatenated]\n' + concatenated);
    console.log('[analysis]\n' + analysisText);

    // Parse LLM output — strip markdown fences if present
    let jsonStr = analysisText.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    // Find the JSON object in case there's preamble text
    const braceStart = jsonStr.indexOf('{');
    const braceEnd = jsonStr.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[upload] failed to parse analysis JSON:', e.message);
      console.error('[upload] raw analysisText:', analysisText);
      return res.status(500).json({ error: 'Failed to parse analysis result' });
    }

    // Ensure the response matches frontend's expected shape: { mbti[3], description[3], thoughts[3] }
    const response = {
      mbti: Array.isArray(parsed.mbti) ? parsed.mbti.slice(0, 3) : [],
      description: Array.isArray(parsed.description) ? parsed.description.slice(0, 3) : [],
      roast_line: Array.isArray(parsed.roast_line) ? parsed.roast_line.slice(0, 3) : [],
      type_label: Array.isArray(parsed.type_label) ? parsed.type_label.slice(0, 3) : [],
      thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts.slice(0, 3) : [],
    };
    console.log('[upload] response:', JSON.stringify(response, null, 2));
    bumpStats();
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message, stderr: err.stderr });
  } finally {
    // Clean up temp files regardless of success or failure
    if (framesDir) fs.rm(framesDir, { recursive: true, force: true }, () => {});
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
});

// --- Totem generation (DALL-E 3) ---
const TOTEM_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';

// Each MBTI type maps to a unique visual archetype for variety
const MBTI_VISUALS = {
  INTJ: { animal: 'owl', flora: 'nightshade and thorns', mood: 'mysterious and precise', palette: 'deep navy, silver, and black' },
  INTP: { animal: 'cat', flora: 'ferns and mushrooms', mood: 'curious and cerebral', palette: 'teal, cream, and charcoal' },
  ENTJ: { animal: 'eagle', flora: 'oak leaves and lightning bolts', mood: 'commanding and fierce', palette: 'gold, crimson, and black' },
  ENTP: { animal: 'fox', flora: 'wildflowers and sparks', mood: 'chaotic and playful', palette: 'electric orange, purple, and black' },
  INFJ: { animal: 'deer', flora: 'moonflowers and crescent moons', mood: 'ethereal and tender', palette: 'lavender, pearl, and deep blue' },
  INFP: { animal: 'rabbit', flora: 'cherry blossoms and trailing vines', mood: 'dreamy and wistful', palette: 'soft pink, sage green, and ivory' },
  ENFJ: { animal: 'swan', flora: 'sunflowers and ribbons', mood: 'warm and radiant', palette: 'golden yellow, coral, and cream' },
  ENFP: { animal: 'butterfly', flora: 'dandelions and confetti', mood: 'joyful and whimsical', palette: 'hot pink, turquoise, and sunshine yellow' },
  ISTJ: { animal: 'bear', flora: 'pine branches and stone', mood: 'steady and grounded', palette: 'forest green, brown, and slate' },
  ISFJ: { animal: 'turtle', flora: 'forget-me-nots and seashells', mood: 'gentle and protective', palette: 'ocean blue, sandy beige, and soft white' },
  ESTJ: { animal: 'lion', flora: 'laurel wreaths and shields', mood: 'bold and structured', palette: 'royal blue, gold, and black' },
  ESFJ: { animal: 'dolphin', flora: 'daisies and hearts', mood: 'cheerful and nurturing', palette: 'sky blue, coral pink, and white' },
  ISTP: { animal: 'wolf', flora: 'bare branches and steel', mood: 'sharp and independent', palette: 'gunmetal grey, rust red, and black' },
  ISFP: { animal: 'hummingbird', flora: 'watercolor poppies and feathers', mood: 'free-spirited and vivid', palette: 'sunset orange, magenta, and gold' },
  ESTP: { animal: 'panther', flora: 'flames and tropical leaves', mood: 'electric and daring', palette: 'neon red, black, and chrome' },
  ESFP: { animal: 'parrot', flora: 'hibiscus and fireworks', mood: 'vibrant and explosive', palette: 'fuchsia, lime green, and bright yellow' },
};

app.post('/api/generate-totem', express.json(), async (req, res) => {
  const { mbti, description, thought } = req.body;
  console.log('[totem] request:', { mbti, description, thought: thought?.slice(0, 50) });
  if (!mbti) return res.status(400).json({ error: 'missing mbti' });

  const vis = MBTI_VISUALS[mbti.toUpperCase()] || MBTI_VISUALS.INTP;

  try {
    // Extract a visual seed from description to make each generation unique
    const descSnippet = (description || '').slice(0, 120);
    const thoughtSnippet = (thought || '').slice(0, 60);

    const prompt = `A neo-traditional tattoo flash illustration, square composition on cream parchment background. The central figure is a stylized ${vis.animal} character — its expression and pose should reflect this personality: "${descSnippet}". Surround the ${vis.animal} with ${vis.flora}, plus symbolic objects that represent: "${thoughtSnippet}". The ${vis.animal} has a ${vis.mood} aura. Bold black ink outlines with rich saturated color fills in ${vis.palette}. Dynamic asymmetric composition, NOT symmetrical. Each element should feel personal and specific, not generic. NO text, NO letters, NO words in the image. Tattoo flash sheet style, high detail, isolated design on cream background.`;

    console.log('[totem] generating with prompt:', prompt.slice(0, 120) + '...');
    const result = await openai.images.generate({
      model: TOTEM_MODEL,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    });

    const b64 = result.data[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({ error: 'no image generated' });
    }
    console.log('[totem] generated, size:', b64.length);
    res.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('[totem] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/generate', async (req, res) => {
  const { mbti, description } = req.query;
  const rawThoughts = req.query.thoughts ?? req.query.thought ?? [];
  let thoughts = [].concat(rawThoughts);
  if (thoughts.length === 1 && typeof thoughts[0] === 'string') {
    const s = thoughts[0].trim();
    if (s.startsWith('[')) {
      try { thoughts = JSON.parse(s); } catch {}
    }
  }
  console.log('[generate] inputs:', { mbti, description, thoughts });

  // --- Phase 1: generate the video prompt (blocking) ---
  let videoPrompt;
  try {
    const filled = videoPromptPrompt({})
      .replaceAll('{mbti}', String(mbti ?? ''))
      .replaceAll('{description}', String(description ?? ''))
      .replaceAll('{thought}', thoughts.join(' / '))
      .replaceAll('{thoughts}', JSON.stringify(thoughts));
    const completion = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: filled }],
    });
    videoPrompt = (completion.choices[0]?.message?.content ?? '').trim();
    console.log('[generate] script:', videoPrompt);
  } catch (err) {
    console.error('[generate] prompt error', err);
    return res.status(500).json({ error: err.message });
  }

  // --- Phase 2: SSE stream — spawn generate.py and relay progress ---
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendSSE = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial prompt_ready event so frontend knows we're starting generation
  sendSSE('progress', { status: 'creating', attempt: 0, elapsed_s: 0 });

  const avatarPath = path.join(__dirname, 'dist', 'avatars', `${String(mbti ?? '').trim().toLowerCase()}.png`);
  console.log('[generate] avatar:', avatarPath);
  const child = spawn('uv', ['run', path.join(__dirname, 'generate.py'), videoPrompt, avatarPath], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Relay stderr to server console for debugging
  child.stderr.on('data', (d) => process.stderr.write(d));

  // Read stdout line-by-line and relay as SSE events
  const rl = createInterface({ input: child.stdout });
  let videoUrl = null;
  let hadError = false;

  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.event === 'progress') {
        sendSSE('progress', { status: msg.status, attempt: msg.attempt, elapsed_s: msg.elapsed_s });
      } else if (msg.event === 'done') {
        videoUrl = msg.video_url;
        sendSSE('done', { video_url: videoUrl });
      } else if (msg.event === 'error') {
        hadError = true;
        sendSSE('error', { message: msg.message });
      }
    } catch {
      // non-JSON line, ignore
    }
  });

  child.on('close', async (code) => {
    if (hadError || !videoUrl) {
      if (!hadError) sendSSE('error', { message: `generate.py exited ${code} without result` });
      res.end();
      return;
    }
    // Video URL obtained — notify frontend to download it
    // The SSE stream ends here; frontend will fetch the video separately
    res.end();
  });

  child.on('error', (err) => {
    console.error('[generate] spawn error', err);
    sendSSE('error', { message: err.message });
    res.end();
  });

  // Clean up if client disconnects while still generating
  let childDone = false;
  child.on('close', () => { childDone = true; });
  req.on('close', () => {
    if (!childDone) {
      console.log('[generate] client disconnected, killing child');
      child.kill();
    }
    rl.close();
  });
});

// Proxy endpoint: fetch video from upstream URL and stream to client.
// Forwards Range headers so HTML5 video players can seek without buffering the full file.
app.get('/api/generate/video', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'missing url param' });
  console.log('[generate/video] proxying:', url.slice(0, 120) + '…');
  try {
    const upstreamHeaders = {};
    if (req.headers.range) upstreamHeaders['range'] = req.headers.range;

    const upstream = await fetch(url, { headers: upstreamHeaders });
    console.log('[generate/video] upstream status:', upstream.status, 'content-type:', upstream.headers.get('content-type'));
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(502).json({ error: `upstream ${upstream.status}` });
    }

    // Mirror the upstream status (200 or 206 Partial Content)
    res.status(upstream.status);
    res.type('video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    const forward = ['content-length', 'content-range', 'last-modified', 'etag'];
    for (const h of forward) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h === 'content-range' ? 'Content-Range' : h, v);
    }

    const len = upstream.headers.get('content-length');
    console.log('[generate/video] streaming', len ? `${len} bytes` : 'unknown size', upstream.status === 206 ? '(partial)' : '');

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('[generate/video] error', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4184;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`listening on 0.0.0.0:${PORT}`);
});
