import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app"; 

describe("Microservice Integration Tests", { timeout: 15000 }, () => {
  // Payload Test
  it("should redact credit cards and return 200 OK", async () => {
    const res = await request(app).post("/feedback").send({ text: "Card: 1111222233334444" });
    expect(res.status).toBe(200);
    expect(res.body.redactedText).toContain("[REDACTED]");
    expect(res.body.redactedText).not.toContain("1111222233334444");
  });

  // Edge Case Test
  it("should return 400 Bad Request for empty payload", async () => {
    const res = await request(app).post("/feedback").send({});
    expect(res.status).toBe(400);
  });
  
  // Custom Complex Scenarios Test
  it("should globally redact multiple different PII items simultaneously", async () => {
    const res = await request(app).post("/feedback").send({
      text: "Hello, my email is test@domain.com, card is 9999888877776666, phone is (123) 456-7890."
    });
    expect(res.status).toBe(200);
    expect(res.body.redactedText).not.toContain("test@domain.com");
    expect(res.body.redactedText).not.toContain("9999888877776666");
    expect(res.body.redactedText).not.toContain("(123) 456-7890");
    
    // Ensure all three occurrences are redacted
    const count = (res.body.redactedText.match(/\[REDACTED\]/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
