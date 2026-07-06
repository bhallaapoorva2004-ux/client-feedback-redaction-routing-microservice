import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

describe("Microservice Integration Tests", { timeout: 15000 }, () => {
  
  // Clear history before each test to ensure test isolation
  beforeEach(async () => {
    await request(app).delete("/api/feedback/history");
  });

  describe("POST /feedback (and alias /api/feedback)", () => {
    it("should redact credit cards and route positive sentiment to Marketing", async () => {
      const res = await request(app)
        .post("/feedback")
        .send({ text: "I love this product! My card is 1111-2222-3333-4444." });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.redactedText).toContain("[REDACTED]");
      expect(res.body.redactedText).not.toContain("1111-2222-3333-4444");
      expect(res.body.sentiment).toBe("Positive");
      expect(res.body.targetRoute).toBe("Marketing");
      expect(res.body.usingAI).toBe(false);
    });

    it("should redact phone numbers, emails, and health IDs, routing negative sentiment to Priority Support", async () => {
      const res = await request(app)
        .post("/api/feedback")
        .send({ 
          text: "This is terrible! Phone is +1 (555) 019-2834, email is help@support.com, and health ID is B812A832." 
        });

      expect(res.status).toBe(200);
      expect(res.body.redactedText).not.toContain("+1 (555) 019-2834");
      expect(res.body.redactedText).not.toContain("help@support.com");
      expect(res.body.redactedText).not.toContain("B812A832");
      
      const count = (res.body.redactedText.match(/\[REDACTED\]/g) || []).length;
      expect(count).toBe(3);
      
      expect(res.body.sentiment).toBe("Negative");
      expect(res.body.targetRoute).toBe("Priority Support");
    });

    it("should route neutral feedback to Priority Support", async () => {
      const res = await request(app)
        .post("/feedback")
        .send({ text: "The delivery arrived. Health ID is AX8921092." });

      expect(res.status).toBe(200);
      expect(res.body.redactedText).not.toContain("AX8921092");
      expect(res.body.sentiment).toBe("Neutral");
      expect(res.body.targetRoute).toBe("Priority Support");
    });
  });

  describe("Validation Constraints", () => {
    it("should return 400 Bad Request for missing text key", async () => {
      const res = await request(app).post("/feedback").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    it("should return 400 Bad Request for empty string text", async () => {
      const res = await request(app).post("/feedback").send({ text: "   " });
      expect(res.status).toBe(400);
    });

    it("should return 400 Bad Request for non-string text data type", async () => {
      const res = await request(app).post("/feedback").send({ text: 12345 });
      expect(res.status).toBe(400);
    });
  });

  describe("History Endpoints", () => {
    it("should record submissions in history and retrieve them", async () => {
      // 1. Submit feedback
      await request(app).post("/feedback").send({ text: "I love it!" });
      await request(app).post("/feedback").send({ text: "Worst service ever." });

      // 2. Fetch history
      const historyRes = await request(app).get("/api/feedback/history");
      expect(historyRes.status).toBe(200);
      expect(historyRes.body).toBeInstanceOf(Array);
      expect(historyRes.body.length).toBe(2);

      // Verify LIFO order (unshift is used in backend database)
      expect(historyRes.body[0].originalText).toBe("Worst service ever.");
      expect(historyRes.body[1].originalText).toBe("I love it!");
    });

    it("should clear database history on DELETE request", async () => {
      // Submit feedback
      await request(app).post("/feedback").send({ text: "Happy customer" });

      // Check it exists
      let historyRes = await request(app).get("/api/feedback/history");
      expect(historyRes.body.length).toBe(1);

      // Clear history
      const deleteRes = await request(app).delete("/api/feedback/history");
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify it's empty
      historyRes = await request(app).get("/api/feedback/history");
      expect(historyRes.body.length).toBe(0);
    });
  });
});
