import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

const {
  PORT = 3001,
  LANGFLOW_BASE_URL,
  LANGFLOW_FLOW_ID,
  LANGFLOW_API_KEY,
  READFILE_COMPONENT_1,
  READFILE_COMPONENT_2,
  BUILD1_PATH,
  BUILD2_PATH,
} = process.env;

for (const [key, value] of Object.entries({
  LANGFLOW_BASE_URL,
  LANGFLOW_FLOW_ID,
  LANGFLOW_API_KEY,
  READFILE_COMPONENT_1,
  READFILE_COMPONENT_2,
  BUILD1_PATH,
  BUILD2_PATH,
})) {
  if (!value) {
    console.error(`Missing required env var: ${key}. Check backend/.env`);
    process.exit(1);
  }
}

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

function writeUpload(file, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, file.buffer);
}

app.post(
  '/api/compare',
  upload.fields([
    { name: 'build1', maxCount: 1 },
    { name: 'build2', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const build1 = req.files?.build1?.[0];
      const build2 = req.files?.build2?.[0];

      if (!build1 || !build2) {
        return res.status(400).json({ error: 'Both build1 and build2 JSON files are required.' });
      }

      writeUpload(build1, BUILD1_PATH);
      writeUpload(build2, BUILD2_PATH);

      const url = `${LANGFLOW_BASE_URL}/api/v1/run/${LANGFLOW_FLOW_ID}?stream=false&x-api-key=${LANGFLOW_API_KEY}`;

      const langflowResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_type: 'chat',
          input_type: 'chat',
          input_value: '',
          tweaks: {
            [READFILE_COMPONENT_1]: { path: BUILD1_PATH },
            [READFILE_COMPONENT_2]: { path: BUILD2_PATH },
          },
        }),
      });

      const raw = await langflowResponse.json();

      if (!langflowResponse.ok) {
        return res.status(langflowResponse.status).json({ error: 'Langflow request failed', raw });
      }

      const text = raw?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ?? null;
      const properties = raw?.outputs?.[0]?.outputs?.[0]?.results?.message?.properties ?? null;

      res.json({ text, properties, raw });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
