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
      if (role === 'EMPLOYEE') {
        const data = await performanceApi.getMyPerformance();
        setReviews(data || []);
      } else {
        const res = await performanceApi.listReviews();
        setReviews(res.items || []);

        const emps = await employeesApi.getEmployees({ page_size: 100 });
        setEmployeesList(emps.items || []);
      }
    } catch (err) {
      console.error('Failed to load performance reviews:', err);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Performance Evaluations
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            {role === 'EMPLOYEE'
              ? 'Your formal quarterly appraisal ratings, goal completions, and manager feedback'
              : 'Conduct structured appraisals, evaluate competency milestones, and track ratings'}
          </p>
        </div>

        {role !== 'EMPLOYEE' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Appraisal</span>
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-[#71806B]/15 border border-[#71806B]/30 text-[#46513F] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-[#78756F]">
            Loading performance evaluations...
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-[#78756F] bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl">
            No performance evaluation records found.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.review_id}
              className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]/60 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#71806B] bg-[#71806B]/10 px-2 py-0.5 rounded-full">
                      {rev.period}
                    </span>
                    <h3 className="text-base font-bold text-[#242321] mt-1.5">
                      {rev.employee_name}
                    </h3>
                    <p className="text-xs text-[#78756F]">
                      {rev.department} • Reviewer: {rev.reviewer_name || 'HR/Manager'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#78756F] block">
                      Score
                    </span>
                    <span className="text-2xl font-extrabold text-[#46513F]">
                      {rev.overall_score?.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#78756F] font-normal"> / 5.0</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[#78756F] mb-1">
                      <span>Goals Alignment:</span>
                      <strong className="text-[#242321]">{rev.goals_rating?.toFixed(1)} / 5.0</strong>
                    </div>
                    <div className="w-full bg-[#EAE6DE] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#46513F] h-1.5 rounded-full"
                        style={{ width: `${((rev.goals_rating || 0) / 5.0) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {rev.strengths && (
                    <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC]">
                      <span className="font-bold text-[#46513F] block text-[11px] mb-0.5">
                        Key Strengths:
                      </span>
                      <p className="text-[#242321]">{rev.strengths}</p>
                    </div>
                  )}

                  {rev.areas_for_improvement && (
                    <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC]">
                      <span className="font-bold text-[#C8755A] block text-[11px] mb-0.5">
                        Areas for Development:
                      </span>
                      <p className="text-[#242321]">{rev.areas_for_improvement}</p>
                    </div>
                  )}

                  {rev.comments && (
                    <p className="text-[11px] text-[#78756F] italic">"{rev.comments}"</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D8D4CC]/60 flex items-center justify-between text-[11px] text-[#78756F]">
                <span>Appraisal ID: {rev.review_id}</span>
                <span className="font-bold text-[#46513F] uppercase">{rev.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Appraisal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]">
              <h3 className="text-base font-bold text-[#242321]">Submit Performance Appraisal</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#78756F] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Select Employee *</label>
                <select
                  required
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
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
                  <label className="block font-semibold mb-1 text-[#242321]">Review Period *</label>
                  <input
                    type="text"
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Q3 2026"
                    className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#242321]">Overall Score (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#242321]">Goals Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    required
                    value={goalsRating}
                    onChange={(e) => setGoalsRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Core Strengths *</label>
                <textarea
                  required
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Key accomplishments and competencies..."
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Areas for Improvement *</label>
                <textarea
                  required
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Growth opportunities..."
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Summary Comments</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Managerial appraisal remarks..."
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#D8D4CC] rounded-lg font-semibold hover:bg-[#EAE6DE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#46513F] text-white rounded-lg font-bold hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50"
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
