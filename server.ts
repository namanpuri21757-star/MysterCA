import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = "provenance.db";

app.use(express.json());

// API Routes
app.post("/api/init-db", async (req: Request, res: Response) => {
  try {
    const { stdout, stderr } = await execPromise(`python3 -m provenance_tool.cli init-db --db ${DB_PATH}`);
    res.json({ message: "Database initialized", output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/snapshot", async (req: Request, res: Response) => {
  const { datasetId, url } = req.body;
  if (!datasetId || !url) {
    return res.status(400).json({ error: "datasetId and url are required" });
  }
  try {
    const { stdout, stderr } = await execPromise(`python3 -m provenance_tool.cli snapshot-policies --db ${DB_PATH} --dataset-id ${datasetId} --url ${url}`);
    res.json({ message: "Snapshot recorded", output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/create-run", async (req: Request, res: Response) => {
  const { runId, description, codeVersion, inputs, outputs, modelIds } = req.body;
  
  let command = `python3 -m provenance_tool.cli create-run --db ${DB_PATH} --run-id ${runId} --description "${description}"`;
  if (codeVersion) command += ` --code-version ${codeVersion}`;
  if (inputs) inputs.forEach((id: string) => command += ` --input ${id}`);
  if (outputs) outputs.forEach((id: string) => command += ` --output ${id}`);
  if (modelIds) modelIds.forEach((id: string) => command += ` --model-id ${id}`);

  try {
    const { stdout, stderr } = await execPromise(command);
    res.json({ message: "Run recorded", output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/report/:artifactId", async (req: Request, res: Response) => {
  const { artifactId } = req.params;
  const reportPath = `report_${Date.now()}.json`;
  try {
    await execPromise(`python3 -m provenance_tool.cli generate-report --db ${DB_PATH} --artifact-id ${artifactId} --out ${reportPath}`);
    const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    fs.unlinkSync(reportPath); // Clean up
    res.json(reportData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  // SPA Fallback: Serve index.html for any non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
  });
}

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
