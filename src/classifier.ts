import { redactTextWithRegex, analyzeSentimentFallback } from "./redactor.js";

export interface RedactionResult {
  redactedText: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  targetRoute: "Marketing" | "Priority Support";
  explanation: string;
  usingAI: boolean;
}

/**
 * Standardize and analyze text locally using Regex and keyword matching.
 * Performs Regex redaction and routes feedback based on sentiment analysis rules.
 */
export async function redactAndRoute(text: string): Promise<RedactionResult> {
  // Step 1: Redact Credit Cards, Phone Numbers, Emails, and Health IDs using secure local Regex
  const redacted = redactTextWithRegex(text);
  
  // Step 2: Analyze sentiment locally
  const analysis = analyzeSentimentFallback(redacted);
  
  return {
    redactedText: redacted,
    sentiment: analysis.sentiment,
    targetRoute: analysis.targetRoute,
    explanation: analysis.explanation,
    usingAI: false, // Explicitly set to false as Google API is removed
  };
}
