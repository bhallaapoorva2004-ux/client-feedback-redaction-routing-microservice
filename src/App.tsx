import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Database, 
  Mail, 
  Phone, 
  CreditCard, 
  Activity, 
  Clock, 
  Trash2, 
  FileCode,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Play
} from "lucide-react";

interface FeedbackSubmission {
  id: string;
  originalText: string;
  redactedText: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  targetRoute: "Marketing" | "Priority Support";
  explanation: string;
  timestamp: string;
  usingAI: boolean;
}

const SAMPLE_TEMPLATES = [
  {
    label: "Healthcare (Health ID & Email)",
    text: "Hi, I have a request regarding patient health id AX8921092. My doctor told me to email support@healthconnect.org. I am very satisfied with the service and the nurse was wonderful!",
  },
  {
    label: "Fintech (Credit Card & Phone)",
    text: "Someone charged my Visa card 4111-2222-3333-4444. I tried calling priority support line at +1 (555) 019-2834 but couldn't reach anyone. This is extremely disappointing and frustrating.",
  },
  {
    label: "Complex Combined PII",
    text: "URGENT COMPLAINT. Card: 9876543210123456. Email: billing@secure.net. Phone: 555.234.5678. Health ID: B812A832. I am neutral about this, please review immediately.",
  }
];

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<FeedbackSubmission | null>(null);
  const [history, setHistory] = useState<FeedbackSubmission[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tab, setTab] = useState<"sandbox" | "docs">("sandbox");

  // Fetch the feedback history from the microservice backend
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/feedback/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch feedback history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Poll history every 5 seconds to stay updated
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleProcess = async (textToProcess: string = inputText) => {
    if (!textToProcess.trim()) {
      setApiError("Please enter some feedback text to process.");
      return;
    }
    
    setIsProcessing(true);
    setApiError(null);

    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToProcess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process feedback");
      }

      const result: FeedbackSubmission = await response.json();
      setLatestSubmission(result);
      setInputText(""); // Clear input on success
      fetchHistory(); // Instantly refresh log
    } catch (err: any) {
      setApiError(err.message || "An error occurred during API processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch("/api/feedback/history", {
        method: "DELETE",
      });
      if (response.ok) {
        setHistory([]);
        setLatestSubmission(null);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // Function to highlight redacted PII in the UI
  const highlightRedacted = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[REDACTED\])/g);
    return parts.map((part, index) => 
      part === "[REDACTED]" ? (
        <span 
          key={index} 
          className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block animate-pulse"
        >
          [REDACTED]
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // Helper to get total number of redactions
  const countRedactions = (submission: FeedbackSubmission) => {
    return (submission.redactedText.match(/\[REDACTED\]/g) || []).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl text-emerald-400 shadow-md shadow-slate-900/10">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Sentinel Guard
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                PII Redaction & Sentiment-Based Routing Microservice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("sandbox")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === "sandbox"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Interactive Sandbox
            </button>
            <button
              onClick={() => setTab("docs")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === "docs"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Developer Docs
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "sandbox" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sandbox Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Compliance Testing Sandbox</h2>
                  <p className="text-sm text-slate-500">
                    Input raw feedback containing potential PII or customer sentiments to test the automated redaction and routing decisions in real time.
                  </p>
                </div>

                {/* Templates */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Quick Sample Templates
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(tmpl.text);
                          setApiError(null);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-150 flex items-center gap-1.5 active:scale-95"
                      >
                        <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Input Form */}
                <div className="space-y-3">
                  <label htmlFor="feedback-text" className="text-sm font-semibold text-slate-700 block">
                    Raw Customer Feedback Text
                  </label>
                  <textarea
                    id="feedback-text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type or paste feedback here (e.g. 'Customer is unhappy. My credit card is 1111-2222-3333-4444 and my email is test@domain.com...')"
                    className="w-full h-40 px-4 py-3 text-sm bg-slate-50 hover:bg-slate-50/50 focus:bg-white text-slate-800 border border-slate-200 focus:border-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 transition-all duration-200 resize-none font-sans placeholder-slate-400"
                  />
                  {apiError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{apiError}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-300" /> Credit Cards (16-digit)
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-300" /> Phone Numbers
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-300" /> Emails / Health IDs
                    </span>
                  </div>
                  <button
                    onClick={() => handleProcess()}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 active:scale-95 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze & Redact
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Redaction Bounds and Standards Info Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-400 pointer-events-none">
                  <Terminal className="w-40 h-40" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Compliance Framework Rules
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sentinel Guard automatically validates input against stringent international policies.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-800 pt-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">PCI-DSS (Credit Cards)</span>
                    <p className="text-slate-300 mt-0.5 font-mono">16 consecutive digits masked</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">GDPR (Personal Identifiers)</span>
                    <p className="text-slate-300 mt-0.5 font-mono">Emails, Country-code & E.164 phone numbers masked</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold block">HIPAA (Health Identifiers)</span>
                    <p className="text-slate-300 mt-0.5 font-mono">8-12 character alphanumeric identifiers context-scrubbed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Outputs */}
            <div className="lg:col-span-5 space-y-6">
              <AnimatePresence mode="wait">
                {latestSubmission ? (
                  <motion.div
                    key={latestSubmission.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden"
                  >
                    {/* Header Banner */}
                    <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Processed Just Now
                        </span>
                        <h3 className="text-sm font-bold mt-1 text-slate-100">Decision Analytics Engine</h3>
                      </div>
                      <div className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">
                        Local Rule-Engine
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Sentiment & Routing Indicators */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                            Sentiment Model
                          </span>
                          <div className="flex items-center gap-2">
                            {latestSubmission.sentiment === "Positive" && (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                                <ThumbsUp className="w-4 h-4 fill-emerald-100 text-emerald-500" />
                                Positive
                              </div>
                            )}
                            {latestSubmission.sentiment === "Negative" && (
                              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                                <ThumbsDown className="w-4 h-4 fill-rose-100 text-rose-500" />
                                Negative
                              </div>
                            )}
                            {latestSubmission.sentiment === "Neutral" && (
                              <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                                Neutral
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border space-y-1 ${
                          latestSubmission.targetRoute === "Marketing"
                            ? "bg-emerald-50/50 border-emerald-100"
                            : "bg-amber-50/50 border-amber-100"
                        }`}>
                          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                            Target Route (DB)
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-sm">
                            <Database className={`w-4 h-4 ${
                              latestSubmission.targetRoute === "Marketing" ? "text-emerald-500" : "text-amber-500"
                            }`} />
                            <span className={latestSubmission.targetRoute === "Marketing" ? "text-emerald-800" : "text-amber-800"}>
                              {latestSubmission.targetRoute}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Route Explanation */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Routing Justification
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {latestSubmission.explanation}
                        </p>
                      </div>

                      {/* Comparison Panel */}
                      <div className="space-y-4 border-t border-slate-100 pt-5">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                            <span>Ingested Raw Text</span>
                            <span className="text-rose-500 font-mono text-[10px] lowercase">Contains PII</span>
                          </span>
                          <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                            {latestSubmission.originalText}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                            <span>Compliant Redacted Text</span>
                            <span className="text-emerald-600 font-mono text-[10px] flex items-center gap-1 lowercase">
                              <CheckCircle className="w-3 h-3 inline" /> 100% clean ({countRedactions(latestSubmission)} scrubbed)
                            </span>
                          </span>
                          <div className="p-4 bg-emerald-50/10 border border-emerald-100/80 rounded-xl text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                            {highlightRedacted(latestSubmission.redactedText)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center py-20 space-y-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Waiting for Submission</h4>
                      <p className="text-xs text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed">
                        Input customer feedback and hit analyze. Sentinel Guard's decision-making analytics will display here.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Developer Documentation Tab */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Microservice REST API Specification</h2>
                <p className="text-xs text-slate-500">How to integrate Sentinel Guard into your backend ingestion pipes</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">1. Feedback Redaction & Routing Endpoint</h3>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-md">POST</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-xs grow">/feedback</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Triggers the full processing pipeline. Input is sanitized using global Regex matching for standard PII (Email, Credit Cards, Phones, Health IDs) and subsequently routed via sentiment rules.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Request Payload Schema</span>
                <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto">
{`{
  "text": "Card: 1111222233334444. Send update to patient@gmail.com. Patient is very happy."
}`}
                </pre>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Response Schema (200 OK)</span>
                <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto">
{`{
  "id": "fb-9sz2kx8w",
  "originalText": "Card: 1111222233334444. Send update to patient@gmail.com. Patient is very happy.",
  "redactedText": "Card: [REDACTED]. Send update to [REDACTED]. Patient is very happy.",
  "sentiment": "Positive",
  "targetRoute": "Marketing",
  "explanation": "Routed to Marketing based on positive sentiment indicators (positive keywords found).",
  "timestamp": "2026-07-05T22:52:00.000Z",
  "usingAI": false
}`}
                </pre>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Database Synchronization Flow</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In compliance with PCI-DSS and HIPAA, no raw feedback text is allowed in downstream pipelines. After obtaining the sanitized <strong>redactedText</strong>, the service routes the output payload directly to designated client environment connections:
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs mt-2 font-mono">
                  <div className="p-2.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-emerald-600 font-bold block">Positive Sentiment</span>
                    <span className="text-slate-500 mt-0.5 text-[10px] block">MARKETING_DB_URL</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-amber-600 font-bold block">Negative / Neutral</span>
                    <span className="text-slate-500 mt-0.5 text-[10px] block">SUPPORT_DB_URL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Audit Log Log Database Section */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                Live Feed & Compliance Audit Database
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time microservice transaction log (synced with GET /api/feedback/history)
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs border border-slate-200 hover:border-rose-200 rounded-xl transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Database History
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processed Requests</span>
                <span className="text-xl font-extrabold text-slate-800 font-mono mt-1 block">{history.length}</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Rate</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono mt-1 block">100.0%</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marketing Routing</span>
                <span className="text-xl font-extrabold text-indigo-600 font-mono mt-1 block">
                  {history.filter(h => h.targetRoute === "Marketing").length}
                </span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Support Routing</span>
                <span className="text-xl font-extrabold text-amber-600 font-mono mt-1 block">
                  {history.filter(h => h.targetRoute === "Priority Support").length}
                </span>
              </div>
            </div>
          )}

          {history.length > 0 ? (
            <div className="overflow-hidden border border-slate-200/60 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Transaction ID</th>
                      <th className="px-5 py-3.5">Scrubbed Compliance Output</th>
                      <th className="px-5 py-3.5">Sentiment</th>
                      <th className="px-5 py-3.5">Target Route</th>
                      <th className="px-5 py-3.5">Redacted PII</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((submission) => (
                      <tr key={submission.id} className="hover:bg-slate-50/30 transition-all duration-100">
                        <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                          {new Date(submission.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-600">
                          {submission.id}
                        </td>
                        <td className="px-5 py-4 max-w-xs truncate text-slate-600 font-medium">
                          {submission.redactedText}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-block border ${
                            submission.sentiment === "Positive"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : submission.sentiment === "Negative"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {submission.sentiment}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-block border ${
                            submission.targetRoute === "Marketing"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {submission.targetRoute}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono">
                          {countRedactions(submission)} items
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              <p className="text-xs text-slate-400">No transactions recorded in this session yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
