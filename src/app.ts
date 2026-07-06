import express from "express";
import { redactAndRoute } from "./classifier.js";

const app = express();

// Enable parsing JSON bodies
app.use(express.json());

// In-memory feedback database to support a professional frontend dashboard
export interface FeedbackSubmission {
  id: string;
  originalText: string;
  redactedText: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  targetRoute: "Marketing" | "Priority Support";
  explanation: string;
  timestamp: string;
  usingAI: boolean;
}

const feedbackDatabase: FeedbackSubmission[] = [];

/**
 * Validation Middleware
 */
function validateFeedbackPayload(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "Feedback 'text' property is required and cannot be empty." });
    return;
  }
  next();
}

/**
 * POST /feedback - Core Microservice Endpoint
 * Processes customer feedback, redacts PII/Health IDs, and routes via sentiment analysis.
 */
app.post("/feedback", validateFeedbackPayload, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Process text through our hybrid redaction & routing engine
    const result = await redactAndRoute(text);
    
    const submission: FeedbackSubmission = {
      id: `fb-${Math.random().toString(36).substring(2, 11)}`,
      originalText: text,
      redactedText: result.redactedText,
      sentiment: result.sentiment,
      targetRoute: result.targetRoute,
      explanation: result.explanation,
      timestamp: new Date().toISOString(),
      usingAI: result.usingAI,
    };
    
    // Save to local list for dashboard visibility
    feedbackDatabase.unshift(submission);
    
    // Keep history bounded to 100 entries
    if (feedbackDatabase.length > 100) {
      feedbackDatabase.pop();
    }
    
    // Respond strictly to fulfill BRD and testing requirements
    res.status(200).json(submission);
  } catch (err: any) {
    console.error("Microservice feedback processing error:", err);
    res.status(500).json({ error: "An internal server error occurred while processing feedback." });
  }
});

// Alias endpoint for API-driven standard alignment
app.post("/api/feedback", validateFeedbackPayload, async (req, res) => {
  // Redirect to main handler
  try {
    const { text } = req.body;
    const result = await redactAndRoute(text);
    const submission: FeedbackSubmission = {
      id: `fb-${Math.random().toString(36).substring(2, 11)}`,
      originalText: text,
      redactedText: result.redactedText,
      sentiment: result.sentiment,
      targetRoute: result.targetRoute,
      explanation: result.explanation,
      timestamp: new Date().toISOString(),
      usingAI: result.usingAI,
    };
    feedbackDatabase.unshift(submission);
    if (feedbackDatabase.length > 100) feedbackDatabase.pop();
    res.status(200).json(submission);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

/**
 * GET /api/feedback/history
 * Fetch previous submissions to populate the live dashboard
 */
app.get("/api/feedback/history", (req, res) => {
  res.status(200).json(feedbackDatabase);
});

/**
 * DELETE /api/feedback/history
 * Reset history for local testing
 */
app.delete("/api/feedback/history", (req, res) => {
  feedbackDatabase.length = 0;
  res.status(200).json({ success: true, message: "History cleared successfully." });
});

export default app;
