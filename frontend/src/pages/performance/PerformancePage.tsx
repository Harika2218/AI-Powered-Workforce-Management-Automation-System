import React, { useState, useEffect } from 'react';
import { performanceApi } from '../../api/performance';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import type { PerformanceReview, Employee } from '../../types/api';
import {
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { role } = useAuth();

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'Pending' | 'Draft'>('ALL');
  const [search, setSearch] = useState('');

  // New review modal
  const [showModal, setShowModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [targetEmpId, setTargetEmpId] = useState('');
  const [period, setPeriod] = useState('Q3 2026');
  const [score, setScore] = useState<number>(4.5);
  const [goalsRating, setGoalsRating] = useState<number>(4.0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      if (role === 'EMPLOYEE') {
        const data = await performanceApi.getMyPerformance();
        setReviews(data || []);
      } else {
        const res = await performanceApi.listReviews({
          page_size: 100,
        });
        setReviews(res.items || []);

        const emps = await employeesApi.getEmployees({ page_size: 100 });
        setEmployeesList(emps.items || []);
      }
    } catch (err: any) {
      console.error('Failed to load performance reviews:', err);
      setError('Unable to load performance evaluation records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmpId) return;
    setSubmitting(true);
    setNotification(null);

    try {
      await performanceApi.submitReview({
        employee_id: targetEmpId,
        period,
        overall_score: Number(score),
        goals_rating: Number(goalsRating),
        strengths,
        areas_for_improvement: improvements,
        comments,
      });
      setNotification('Performance appraisal review recorded successfully!');
      setShowModal(false);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Review submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (r.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Performance Evaluations
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {role === 'EMPLOYEE'
              ? 'Your formal quarterly appraisal ratings, goal completions, and manager feedback'
              : 'Conduct structured appraisals, evaluate competency milestones, and track ratings'}
          </p>
        </div>

        {role !== 'EMPLOYEE' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Appraisal</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626]">
          <span>{error}</span>
          <button
            onClick={fetchReviews}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-[#64748B] hover:text-[#172033]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'Completed', 'Pending', 'Draft'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Reviews' : st}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search employee or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none w-64 focus:border-[#2563EB]"
            />
          </div>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-[#64748B]">
            Loading performance evaluations...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl">
            No performance evaluation records found.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.review_id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {rev.period}
                    </span>
                    <h3 className="text-base font-bold text-[#172033] mt-1.5">
                      {rev.employee_name}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {rev.department} • Reviewer: {rev.reviewer_name || 'HR/Manager'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                      Score
                    </span>
                    <span className="text-2xl font-extrabold text-[#2563EB]">
                      {rev.overall_score?.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#64748B] font-normal"> / 5.0</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[#64748B] mb-1">
                      <span>Goals Alignment:</span>
                      <strong className="text-[#172033]">{rev.goals_rating?.toFixed(1)} / 5.0</strong>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2563EB] h-1.5 rounded-full"
                        style={{ width: `${((rev.goals_rating || 0) / 5.0) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {rev.strengths && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <span className="font-bold text-[#16A34A] block text-[11px] mb-0.5">
                        Key Strengths:
                      </span>
                      <p className="text-[#172033]">{rev.strengths}</p>
                    </div>
                  )}

                  {rev.areas_for_improvement && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                      <span className="font-bold text-[#D97706] block text-[11px] mb-0.5">
                        Areas for Development:
                      </span>
                      <p className="text-[#172033]">{rev.areas_for_improvement}</p>
                    </div>
                  )}

                  {rev.comments && (
                    <p className="text-[11px] text-[#64748B] italic">"{rev.comments}"</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Appraisal ID: {rev.review_id}</span>
                <span className="font-bold text-[#2563EB] uppercase">{rev.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Appraisal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Submit Performance Appraisal</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Select Employee *</label>
                <select
                  required
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                >
                  <option value="">Choose an employee...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Review Period *</label>
                  <input
                    type="text"
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Q3 2026"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Overall Score (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Goals Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    required
                    value={goalsRating}
                    onChange={(e) => setGoalsRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Core Strengths *</label>
                <textarea
                  required
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Key accomplishments and competencies..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Areas for Improvement *</label>
                <textarea
                  required
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Growth opportunities..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Summary Comments</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Managerial appraisal remarks..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {submitting ? 'Submitting...' : 'Record Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
