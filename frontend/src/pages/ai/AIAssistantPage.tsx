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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            HR Intelligence Assistant
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Real-time natural language query interface powered by MongoDB aggregation pipelines
          </p>
        </div>

        {role !== 'EMPLOYEE' && (
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl text-xs font-semibold border border-[#E2E8F0] shadow-xs">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'assistant'
                  ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'insights'
                  ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Attendance Insights
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'forecast'
                  ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
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
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
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
                className="flex-1 px-4 py-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20 active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Querying...' : 'Ask'}</span>
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggested Sample Inquiries */}
            <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#64748B] block mb-2 uppercase tracking-wider">
                Suggested Questions ({role} Scope):
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#2563EB] text-[#172033] font-medium transition-colors cursor-pointer text-left shadow-2xs"
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
              <div className="py-12 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
                <Bot className="w-10 h-10 mx-auto text-[#2563EB] mb-3 opacity-75" />
                <p className="font-bold text-[#172033] text-sm">Ready for Natural Language HR Queries</p>
                <p className="mt-1 max-w-md mx-auto text-[#64748B]">
                  Type a workforce question above or choose a suggested prompt to query real MongoDB records.
                </p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <span className="text-xs font-bold text-[#172033]">
                      "{item.query}"
                    </span>
                    <span className="text-[10px] text-[#16A34A] font-mono font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Confidence: {Math.round((item.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-[#172033] leading-relaxed font-medium whitespace-pre-line">
                    {item.answer}
                  </p>

                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-[#64748B] font-semibold">Follow-up:</span>
                      {item.suggestions.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleAsk(s)}
                          className="text-[10px] px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#172033] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#BFDBFE] border border-transparent font-medium transition-colors cursor-pointer"
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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <BrainCircuit className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Automated Attendance Insights</h3>
              <p className="text-[11px] text-[#64748B] font-medium">
                Generated dynamically from current workforce logs and statistical anomalies
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {!insights?.insights || insights.insights.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center font-medium">
                All attendance patterns are within nominal benchmarks. No urgent alerts detected.
              </p>
            ) : (
              insights.insights.map((ins, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    ins.level === 'alert'
                      ? 'bg-red-50/50 border-red-200'
                      : ins.level === 'warning'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">
                      {ins.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ins.level === 'alert'
                          ? 'bg-[#DC2626] text-white'
                          : ins.level === 'warning'
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#2563EB] text-white'
                      }`}
                    >
                      {ins.level}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#172033] mt-1.5">{ins.headline}</h4>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">{ins.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WORKFORCE FORECAST */}
      {activeTab === 'forecast' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <TrendingUp className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Workforce Headcount Forecasting</h3>
              <p className="text-[11px] text-[#64748B] font-medium">
                Time-series historical velocity and projected headcount growth for next 6 months
              </p>
            </div>
          </div>

          {forecast && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Projected Attrition Rate
                  </span>
                  <p className="text-2xl font-bold text-[#D97706] mt-1">
                    {(forecast.projected_attrition_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Forecast Horizon
                  </span>
                  <p className="text-2xl font-bold text-[#2563EB] mt-1">6 Months</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#172033] mb-3">Projected Growth Velocity</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast.forecast_next_6_months || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="projected_headcount"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ fill: '#2563EB', r: 4 }}
                        activeDot={{ r: 6 }}
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
