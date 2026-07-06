/**
 * PII Redaction and Fallback Analysis Logic
 */

// Credit Cards: 16-digit numeric sequences with optional spaces or dashes
export const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){16}\b/g;

// Phone Numbers: E.164 and local phone formats
export const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Email Addresses: RFC 5322 compliant
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Health IDs: Alphanumeric 8-12 characters containing at least one letter and at least one digit
export const HEALTH_ID_REGEX = /\b(?=[A-Za-z0-9]*[0-9])(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{8,12}\b/g;

/**
 * Perform local regex-based PII redaction.
 * Replaces credit cards, phone numbers, email addresses, and alphanumeric Health IDs with [REDACTED].
 */
export function redactTextWithRegex(text: string): string {
  if (!text) return "";
  
  let redacted = text;
  
  // Apply credit card regex
  redacted = redacted.replace(CREDIT_CARD_REGEX, "[REDACTED]");
  
  // Apply phone regex
  redacted = redacted.replace(PHONE_REGEX, "[REDACTED]");
  
  // Apply email regex
  redacted = redacted.replace(EMAIL_REGEX, "[REDACTED]");
  
  // Apply Health ID regex
  redacted = redacted.replace(HEALTH_ID_REGEX, "[REDACTED]");
  
  return redacted;
}

/**
 * Fallback sentiment analysis and routing decision when Gemini API is unavailable.
 */
export function analyzeSentimentFallback(text: string): {
  sentiment: "Positive" | "Negative" | "Neutral";
  targetRoute: "Marketing" | "Priority Support";
  explanation: string;
} {
  const lower = text.toLowerCase();
  
  // Simple keyword matching for demo/fallback purposes
  const positiveKeywords = [
    "love", "great", "excellent", "perfect", "good", "happy", "satisfied", 
    "awesome", "wonderful", "amazing", "best", "thanks", "thank you", "helpful"
  ];
  const negativeKeywords = [
    "broken", "worst", "hate", "bad", "slow", "error", "fail", "issue", 
    "problem", "angry", "terrible", "support", "useless", "disappointed", 
    "crash", "defect", "poor", "frustrated", "delay"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  if (positiveCount > negativeCount) {
    return {
      sentiment: "Positive",
      targetRoute: "Marketing",
      explanation: `Routed to Marketing based on positive sentiment indicators (positive keywords found).`
    };
  } else if (negativeCount > positiveCount) {
    return {
      sentiment: "Negative",
      targetRoute: "Priority Support",
      explanation: `Routed to Priority Support based on negative sentiment indicators (negative keywords found).`
    };
  } else {
    return {
      sentiment: "Neutral",
      targetRoute: "Priority Support",
      explanation: `Routed to Priority Support (default route for Neutral or balanced sentiment).`
    };
  }
}
