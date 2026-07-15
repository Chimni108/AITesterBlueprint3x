import { useState, useEffect } from "react";
import { COLUMNS } from "../lib/constants";
import { today } from "../lib/utils";

const EMPTY = {
  company: "",
  role: "",
  linkedinUrl: "",
  resume: "",
  dateApplied: today(),
  salary: "",
  notes: "",
  status: "wishlist",
};

export default function JobForm({ initial, onSave, onClose, resumeNames }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.company.trim()) e.company = "Required";
    if (!form.role.trim()) e.role = "Required";
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  const field = "block w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const label = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";
  const err   = "mt-1 text-xs text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Edit Job" : "Add Job"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Company *</label>
              <input className={field} placeholder="Acme Corp" value={form.company} onChange={(e) => set("company", e.target.value)} />
              {errors.company && <p className={err}>{errors.company}</p>}
            </div>
            <div>
              <label className={label}>Role / Title *</label>
              <input className={field} placeholder="Senior QA Engineer" value={form.role} onChange={(e) => set("role", e.target.value)} />
              {errors.role && <p className={err}>{errors.role}</p>}
            </div>
          </div>

          <div>
            <label className={label}>LinkedIn / Job URL</label>
            <input className={field} type="url" placeholder="https://linkedin.com/jobs/view/..." value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Resume used</label>
              <input
                className={field}
                list="resume-list"
                placeholder="QA_Lead_Resume_v2"
                value={form.resume}
                onChange={(e) => set("resume", e.target.value)}
              />
              <datalist id="resume-list">
                {resumeNames.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className={label}>Salary range</label>
              <input className={field} placeholder="₹25-30 LPA" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Date applied</label>
              <input className={field} type="date" value={form.dateApplied} onChange={(e) => set("dateApplied", e.target.value)} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Notes</label>
            <textarea className={`${field} resize-none`} rows={3} placeholder="Recruiter: Sarah — referred by John. 2nd round pending..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            {initial ? "Save changes" : "Add job"}
          </button>
        </div>
      </div>
    </div>
  );
}
