import express from "express";
import cors from "cors";
import multer from "multer";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import fs from "fs";
import { createRequire } from "module";

/* ---------------- CONFIGURATION ---------------- */
dotenv.config();
const require = createRequire(import.meta.url);
const app = express();
const PORT = process.env.PORT || 8000;

/* ---------------- PDFJS SETUP ---------------- */
// We import pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// CRITICAL: Set the worker to handle the parsing logic
// This points to the worker file inside the installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'pdfjs-dist/legacy/build/pdf.worker.mjs';

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- FILE UPLOAD ---------------- */
const upload = multer({ dest: "uploads/" });

/* ---------------- GROQ SETUP ---------------- */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ---------------- HELPER FUNCTION ---------------- */
// Helper to extract text from a PDF Buffer using pdfjs-dist
async function extractTextFromPDF(buffer) {
  // Load the document (we must convert buffer to Uint8Array)
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument(uint8Array);
  const pdfDocument = await loadingTask.promise;

  let fullText = "";

  // Loop through all pages
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine text items (strings) into a single string for this page
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

/* ---------------- ROUTES ---------------- */
app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    filePath = req.file.path;
    console.log(`Processing file: ${filePath}`);

    // 1. Read File
    const fileBuffer = fs.readFileSync(filePath);

    // 2. Extract Text using our new helper
    const text = await extractTextFromPDF(fileBuffer);

    if (!text || text.trim().length === 0) {
      throw new Error("Text extraction returned empty string.");
    }

    console.log(`Successfully extracted ${text.length} characters.`);

    // 3. AI Analysis
    const prompt = `
      You are a financial research assistant. Analyze the following earnings call transcript.
      Return ONLY valid JSON in this exact format:
      {
        "management_tone": "",
        "confidence_level": "",
        "key_positives": [],
        "key_concerns": [],
        "forward_guidance": { "revenue": "", "margin": "", "capex": "" },
        "capacity_utilization": "",
        "new_growth_initiatives": []
      }
      If something is not mentioned, write "Not mentioned". Do not hallucinate.

      Transcript:
      ${text.substring(0, 15000)}
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawOutput = response.choices[0].message.content;
    
    // Clean & Parse
    const cleaned = rawOutput.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error("❌ Error Processing Request:", error);
    res.status(500).json({ 
      error: "Processing failed", 
      details: error.message || "Unknown server error" 
    });
  } finally {
    // 4. Cleanup
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});