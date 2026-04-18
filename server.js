import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { OCR_PROMPT, ANALYSIS_PROMPT, videoPromptPrompt } from './prompts.js';

const execFileP = promisify(execFile);

const N_FRAMES = 4;

const FFMPEG_ROOT = '/Users/b1f6c1c4/ffmpeg/FFmpeg';
const DYLD_PATH = [
  'libavfilter', 'libavutil', 'libavdevice', 'libavformat',
  'libswscale', 'libavcodec', 'libswresample',
].map((d) => path.join(FFMPEG_ROOT, d)).join(':');
const FF_ENV = {
  ...process.env,
  DYLD_LIBRARY_PATH: DYLD_PATH,
  DYLD_FALLBACK_LIBRARY_PATH: DYLD_PATH,
};
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no video file' });
  }
  try {
    const { stdout } = await execFileP(process.env.FFPROBE_BIN, [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate,nb_frames:format=duration',
      '-of', 'default=noprint_wrappers=1',
      req.file.path,
    ], { env: FF_ENV });
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

    const picked = new Set();
    while (picked.size < n) {
      picked.add(lo + Math.floor(Math.random() * rangeSize));
    }
    const indices = [...picked].sort((a, b) => a - b);

    const jobId = randomUUID();
    const framesDir = path.join(DATA_DIR, jobId);
    fs.mkdirSync(framesDir, { recursive: true });

    const selectExpr = indices.map((i) => `eq(n\\,${i})`).join('+');
    await execFileP(process.env.FFMPEG_BIN, [
      '-v', 'error',
      '-i', req.file.path,
      '-vf', `select='${selectExpr}',scale=iw/2:ih/2`,
      '-fps_mode', 'vfr',
      path.join(framesDir, 'frame-%06d.png'),
    ], { env: FF_ENV });

    const frames = fs.readdirSync(framesDir).sort();

    const results = await Promise.all(frames.map(async (fname) => {
      const fpath = path.join(framesDir, fname);
      const b64 = fs.readFileSync(fpath).toString('base64');
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
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

    const concatenated = results.map((r) => r.text).join('\n\n---\n\n');
    const analysis = await openai.chat.completions.create({
      model: 'qwen3-30b-a3b',
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

    res.type('text/plain').send(analysisText);
  } catch (err) {
    res.status(500).json({ error: err.message, stderr: err.stderr });
  }
});

const PLOTS = ['time_capsule', 'prophecy', 'reveal'];

app.get('/generate', async (req, res) => {
  const { mbti, description } = req.query;
  const thoughts = [].concat(req.query.thoughts ?? req.query.thought ?? []);
  const plot_name = req.query.plot || PLOTS[Math.floor(Math.random() * PLOTS.length)];
  try {
    const filled = videoPromptPrompt({})
      .replaceAll('{mbti}', String(mbti ?? ''))
      .replaceAll('{description}', String(description ?? ''))
      .replaceAll('{thoughts}', JSON.stringify(thoughts))
      .replaceAll('{plot_name}', plot_name);
    const completion = await openai.chat.completions.create({
      model: 'qwen3-30b-a3b',
      messages: [{ role: 'user', content: filled }],
    });
    const videoPrompt = (completion.choices[0]?.message?.content ?? '').trim();
    console.log('[generate] plot:', plot_name);
    console.log('[generate] script:', videoPrompt);

    const { stdout, stderr } = await execFileP(
      'uv',
      ['run', path.join(__dirname, 'generate.py'), videoPrompt],
      { env: { ...process.env, ARK_API_KEY: process.env.ARK_API_KEY } },
    );
    if (stderr) console.log('[generate.py stderr]\n' + stderr);
    res.type('application/json').send(stdout);
  } catch (err) {
    console.error('[generate] error', err);
    res.status(500).json({ error: err.message, stderr: err.stderr });
  }
});

app.listen(4184, () => {
  console.log('listening on :4184');
});
