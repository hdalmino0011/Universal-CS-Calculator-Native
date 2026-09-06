import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

app.post('/api/trace-code', async (req, res) => {
  try {
    const { code, language = 'auto', customInput = '' } = req.body;
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Code is required for tracing.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI tracer is not configured on this server (GEMINI_API_KEY missing). Falling back to client emulator.',
        fallback: true
      });
    }

    const systemPrompt = `You are a high-precision, universal code execution simulator, tracer, and DSA (Data Structures & Algorithms) debugger.
Your mission is to rigorously simulate the execution of the user's code in ANY programming language (Python, C++, Java, JavaScript, TypeScript, C, Rust, Go, C#, PHP, Ruby, etc.) line-by-line, step-by-step.
You MUST output ONLY a valid JSON object adhering strictly to this JSON format (no markdown, no backticks, just raw JSON):

{
  "language": "Detected or specified language",
  "title": "Short title describing the algorithm/task (e.g. Binary Search in Array)",
  "algorithmCategory": "e.g. Binary Search, Two Pointers, Dynamic Programming, Sorting, Graph/Tree, Stack/Queue, Recursion, Bit Manipulation, etc.",
  "timeComplexity": "e.g. O(log n)",
  "spaceComplexity": "e.g. O(1)",
  "complexityExplanation": "1-2 sentence explanation of time and space complexity",
  "output": "Complete standard console stdout / return output of the program",
  "totalIterations": 12,
  "steps": [
    {
      "stepNumber": 1,
      "lineNumber": 1,
      "code": "int low = 0, high = arr.size() - 1;",
      "explanation": "Initialize pointer low to 0 and high to 5.",
      "loopIteration": "Setup / Before loop",
      "variables": [
        { "name": "low", "value": "0", "changed": true, "type": "int" },
        { "name": "high", "value": "5", "changed": true, "type": "int" },
        { "name": "target", "value": "7", "changed": false, "type": "int" }
      ],
      "arrayPointers": [
        {
          "arrayName": "arr",
          "elements": ["2", "4", "7", "10", "15", "20"],
          "pointers": [
            { "name": "low", "index": 0, "color": "#10b981" },
            { "name": "high", "index": 5, "color": "#ef4444" }
          ]
        }
      ],
      "callStack": ["main()", "binarySearch(arr, 7)"],
      "stdout": ""
    }
  ]
}

Rules:
1. CRITICAL: Trace EVERY loop, iteration, and output step explicitly! For example, in a loop over i = 0 to 4, unroll and trace every iteration with clear labels like 'Iteration 1 (i = 0)', 'Iteration 2 (i = 1)', 'Iteration 3 (i = 2)', etc. Never skip loop iterations.
2. In each step, clearly state the current state (e.g. "i = 1: Evaluating condition i < 5 (1 < 5 is true). Output updated to '0 1'.").
3. In "stdout", show the cumulative console output emitted up to the current step (e.g., "0", "0 1", "0 1 2"), so the terminal view updates in real time on every step.
4. Ensure "lineNumber" corresponds directly to the 1-based line number in the user's provided code.
5. If an array/list/vector exists, populate "arrayPointers" with elements and pointer indices (e.g. low, high, mid, i, j, curr) to visually highlight them in the array cell visualizer.
6. Track variables meticulously: set "changed": true only when the variable was created or updated in this step.
7. Provide clear, highly understandable, step-by-step pedagogical explanations suited for computer science students and programmers.`;

    const userPrompt = `Language: ${language}\nCustom Input / Arguments: ${customInput || 'None'}\n\nCode to trace:\n\`\`\`\n${code}\n\`\`\``;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
    } catch (primaryErr) {
      console.warn('Primary model error, attempting gemini-flash-latest:', primaryErr.message);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
    }

    const responseText = response.text ? response.text.trim() : '';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      const cleaned = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Error in /api/trace-code:', err);
    return res.status(500).json({
      error: 'Failed to generate code trace: ' + (err.message || 'Unknown error'),
      fallback: true
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
