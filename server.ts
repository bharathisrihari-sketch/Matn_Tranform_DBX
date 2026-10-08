import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Chat API endpoint for multi-turn Gemini assistant (Gemini Tranformx)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', jobContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let systemInstruction = `You are Gemini Tranformx (Gemini TransformX), an elite data engineering AI architect specialized in migrating Matillion ETL jobs to Databricks PySpark and Delta Live Tables (DLT).
Your role:
- Help users translate Matillion Orchestration and Transformation jobs to modern Apache Spark 3.5+ DataFrame code and Delta Live Tables.
- Explain conversion decisions, data quality expectations (@dlt.expect_or_drop), and Delta Lake ACID merge strategies.
- Provide clean, robust, syntax-highlighted code snippets for PySpark, Spark SQL, and Delta Live Tables.
- Advise on Liquid Clustering (CLUSTER BY), Unity Catalog 3-tier namespaces, and Databricks Asset Bundles (DAB).
- Be concise, practical, and prioritize production data engineering best practices.`;

    if (jobContext) {
      systemInstruction += `\n\nCurrent Active Job in Workspace:
- Name: ${jobContext.name} (${jobContext.jobType})
- Description: ${jobContext.description || 'N/A'}
- Components (${jobContext.componentsCount}): ${jobContext.componentsList || 'N/A'}
- Target Format: ${jobContext.outputFormat || 'notebook'}
- Unity Catalog: ${jobContext.useUnityCatalog ? 'Enabled' : 'Disabled'}`;
    }

    // Convert messages to Gemini contents structure
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    // Selected model
    const selectedModel = model || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text || 'I could not generate a response. Please try again.';
    res.json({ text: responseText, model: selectedModel });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while calling the Gemini API' 
    });
  }
});

// Dedicated Gemini API Endpoint for Automated Code Conversion with Assumption Flagging
app.post('/api/gemini/convert', async (req, res) => {
  try {
    const { job, targetLanguage = 'pyspark', options = {} } = req.body;

    if (!job || !job.name) {
      return res.status(400).json({ error: 'Valid Matillion job definition is required' });
    }

    const systemInstruction = `You are an expert compiler and migration specialist converting Matillion ETL jobs to Databricks Lakehouse.
When given a Matillion JSON job:
1. Generate complete, production-grade Databricks code in the user's selected language (${targetLanguage === 'spark_sql' ? 'Spark SQL with DDL and Delta Lake MERGE' : 'PySpark DataFrame API with Delta Lake tables'}).
2. In the code, flag every single assumption made using clear '# ASSUMPTION: ...' comments (or '-- ASSUMPTION: ...' for SQL) covering:
   - Null handling and default replacements
   - Data types and timestamp timezone semantics (e.g., TIMESTAMP_NTZ)
   - Table naming and Unity Catalog namespace hierarchy (catalog.schema.table)
   - Liquid Clustering or Partitioning choices
   - Delta MERGE match keys and deduplication logic
3. Provide a Databricks Workflows job specification JSON block matching the job orchestration.
4. Output cleanly in markdown format with clear code blocks.`;

    const prompt = `Convert the following Matillion ${job.jobType} job into Databricks ${targetLanguage === 'spark_sql' ? 'Spark SQL' : 'PySpark'}:

Job Name: ${job.name}
Description: ${job.description || 'N/A'}
Target Platform: ${job.targetPlatform || 'Snowflake'}
Variables: ${JSON.stringify(job.variables || [])}
Components (${job.components?.length || 0}):
${JSON.stringify(job.components || [], null, 2)}
Links (${job.links?.length || 0}):
${JSON.stringify(job.links || [], null, 2)}

Requirements:
- Target language: ${targetLanguage}
- Use Unity Catalog 3-level namespace
- Ensure all assumptions are flagged with comments
- Include Databricks Workflows job JSON`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const generatedText = response.text || '';
    res.json({
      success: true,
      code: generatedText,
      model: 'gemini-3.8-flash',
      targetLanguage
    });
  } catch (error: any) {
    console.error('Gemini Code Conversion Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to convert job using Gemini API'
    });
  }
});

// Mount Vite middleware in development or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

startServer();
