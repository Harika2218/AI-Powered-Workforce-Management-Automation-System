import React, { useState, useEffect } from 'react';
import { aiApi, type AttendanceInsightsData, type WorkforceForecastData } from '../../api/ai';
import { useAuth } from '../../context/AuthContext';
import type { AIAssistantResponse } from '../../types/api';
import {
  Bot,
  Sparkles,
  Send,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AIAssistantPage: React.FC = () => {
  const { role } = useAuth();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AIAssistantResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Automated Insights
  const [insights, setInsights] = useState<AttendanceInsightsData | null>(null);
  const [forecast, setForecast] = useState<WorkforceForecastData | null>(null);
  const [activeTab, setActiveTab] = useState<'assistant' | 'insights' | 'forecast'>('assistant');

  useEffect(() => {
    if (role !== 'EMPLOYEE') {
      aiApi.getAttendanceInsights().then(setInsights).catch(() => {});
      aiApi.getWorkforceForecast().then(setForecast).catch(() => {});
    }
  }, [role]);

  const handleAsk = async (questionText?: string) => {
    const q = (questionText || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.askAssistant(q);
      setHistory((prev) => [res, ...prev]);
      setQuery('');
    } catch (err: any) {
      console.error('AI Query failed:', err);
      setError(
        err.response?.data?.detail || 'Unable to process inquiry. Please check query syntax.'
      );
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions =
    role === 'HR'
      ? [
          'How many employees are in Engineering?',
          'How many employees are on leave today?',
          'Which department has the highest overtime?',
          'What is the overall attendance rate this month?',
        ]
      : role === 'MANAGER'
      ? [
          'How many direct reports are in my team?',
          'Who is on leave in my team today?',
          'What is my team average performance score?',
          'How many pending leave requests do I have?',
        ]
      : [
          'What is my remaining leave balance?',
          'What was my working hours yesterday?',
          'What is my assigned shift schedule?',
          'Are there any pending leave approvals for me?',
        ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            HR Intelligence Assistant
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            Real-time natural language query interface powered by MongoDB aggregation pipelines
          </p>
        </div>

        {role !== 'EMPLOYEE' && (
          <div className="flex bg-[#EAE6DE]/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'assistant' ? 'bg-[#FFFDF9] text-[#242321] shadow-xs' : 'text-[#78756F]'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'insights' ? 'bg-[#FFFDF9] text-[#242321] shadow-xs' : 'text-[#78756F]'
              }`}
            >
              Attendance Insights
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'forecast' ? 'bg-[#FFFDF9] text-[#242321] shadow-xs' : 'text-[#78756F]'
              }`}
            >
              Workforce Forecast
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: HR ASSISTANT CHAT / QUERY */}
      {activeTab === 'assistant' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Query Input Card */}
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#71806B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#46513F]">
                Ask about your workforce database
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. How many employees are on leave today?"
                className="flex-1 px-4 py-2.5 text-xs border border-[#D8D4CC] rounded-xl bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 bg-[#46513F] text-white rounded-xl text-xs font-bold hover:bg-[#46513F]/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Querying...' : 'Ask'}</span>
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-[#C8755A]/10 border border-[#C8755A]/30 text-[#C8755A] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggested Sample Inquiries */}
            <div className="mt-4 pt-4 border-t border-[#D8D4CC]/60">
              <span className="text-[11px] font-semibold text-[#78756F] block mb-2">
                Suggested Questions ({role} Scope):
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-[#D8D4CC] bg-[#F7F5F0] hover:bg-[#EAE6DE] text-[#242321] font-medium transition-colors cursor-pointer text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation History */}
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#78756F] bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6">
                <Bot className="w-8 h-8 mx-auto text-[#71806B] mb-2 opacity-60" />
                <p className="font-semibold text-[#242321]">Ready for Natural Language HR Queries</p>
                <p className="mt-1">
                  Type a workforce question above or choose a suggested prompt to query real MongoDB records.
                </p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-[#D8D4CC]/50 pb-2.5">
                    <span className="text-xs font-bold text-[#242321]">
                      "{item.query}"
                    </span>
                    <span className="text-[10px] text-[#71806B] font-mono font-semibold bg-[#71806B]/10 px-2 py-0.5 rounded-full">
                      Confidence: {Math.round((item.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-[#242321] leading-relaxed font-medium">
                    {item.answer}
                  </p>

                  {/* If backend returns structured dataset */}
                  {item.data && typeof item.data === 'object' && Object.keys(item.data).length > 0 && (
                    <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC] text-[11px] font-mono text-[#46513F] overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(item.data, null, 2)}</pre>
                    </div>
                  )}

                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-[#78756F]">Follow-up:</span>
                      {item.suggestions.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleAsk(s)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#EAE6DE] text-[#242321] hover:bg-[#D8D4CC] font-semibold transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D8D4CC] pb-3">
            <BrainCircuit className="w-5 h-5 text-[#46513F]" />
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Automated Attendance Insights</h3>
              <p className="text-[11px] text-[#78756F]">
                Generated dynamically from current workforce logs and statistical anomalies
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {!insights?.insights || insights.insights.length === 0 ? (
              <p className="text-xs text-[#78756F] py-6 text-center">
                All attendance patterns are within nominal benchmarks. No urgent alerts detected.
              </p>
            ) : (
              insights.insights.map((ins, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    ins.level === 'alert'
                      ? 'bg-[#C8755A]/10 border-[#C8755A]/30'
                      : ins.level === 'warning'
                      ? 'bg-[#C99A52]/10 border-[#C99A52]/30'
                      : 'bg-[#71806B]/10 border-[#71806B]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#78756F]">
                      {ins.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ins.level === 'alert'
                          ? 'bg-[#C8755A] text-white'
                          : ins.level === 'warning'
                          ? 'bg-[#C99A52] text-white'
                          : 'bg-[#71806B] text-white'
                      }`}
                    >
                      {ins.level}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#242321] mt-1.5">{ins.headline}</h4>
                  <p className="text-xs text-[#78756F] mt-1">{ins.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WORKFORCE FORECAST */}
      {activeTab === 'forecast' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-[#D8D4CC] pb-3">
            <TrendingUp className="w-5 h-5 text-[#46513F]" />
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Workforce Headcount Forecasting</h3>
              <p className="text-[11px] text-[#78756F]">
                Time-series historical velocity and projected headcount growth for next 6 months
              </p>
            </div>
          </div>

          {forecast && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC]">
                  <span className="text-[11px] font-semibold text-[#78756F] uppercase">
                    Projected Attrition Rate
                  </span>
                  <p className="text-2xl font-bold text-[#C99A52] mt-1">
                    {(forecast.projected_attrition_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC]">
                  <span className="text-[11px] font-semibold text-[#78756F] uppercase">
                    Forecast Horizon
                  </span>
                  <p className="text-2xl font-bold text-[#46513F] mt-1">6 Months</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#242321] mb-2">Projected Growth Velocity</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast.forecast_next_6_months || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D8D4CC" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#78756F' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#78756F' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#D8D4CC', fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="projected_headcount"
                        stroke="#46513F"
                        strokeWidth={2.5}
                        name="Projected Headcount"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
