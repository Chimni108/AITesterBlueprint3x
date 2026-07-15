import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { getAllJobs, addJob, updateJob, deleteJob, importJobs } from "./lib/db";
import { newId, today, downloadJson } from "./lib/utils";
import { COLUMNS } from "./lib/constants";
import Column from "./components/Column";
import JobCard from "./components/JobCard";
import JobForm from "./components/JobForm";
import ConfirmDialog from "./components/ConfirmDialog";

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );
}

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dark, setDark] = useState(() => localStorage.getItem("jt-theme") === "dark");
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const importRef = useRef();

  /* theme */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("jt-theme", dark ? "dark" : "light");
  }, [dark]);

  /* load from IndexedDB */
  useEffect(() => { getAllJobs().then(setJobs); }, []);

  /* derived */
  const filtered = jobs.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q);
  });

  const byColumn = Object.fromEntries(
    COLUMNS.map((c) => [c.id, filtered.filter((j) => j.status === c.id)])
  );

  const resumeNames = [...new Set(jobs.map((j) => j.resume).filter(Boolean))];

  /* CRUD */
  async function handleSave(form) {
    if (editJob) {
      const updated = { ...editJob, ...form };
      await updateJob(updated);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } else {
      const job = { ...form, id: newId(), dateApplied: form.dateApplied || today() };
      await addJob(job);
      setJobs((prev) => [...prev, job]);
    }
    setShowForm(false);
    setEditJob(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteJob(deleteTarget.id);
    setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  /* DnD */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null;

  function handleDragStart({ active }) { setActiveId(active.id); }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over) return;
    const dragged = jobs.find((j) => j.id === active.id);
    if (!dragged) return;
    const overIsColumn = COLUMNS.some((c) => c.id === over.id);
    const targetCol = overIsColumn ? over.id : jobs.find((j) => j.id === over.id)?.status;
    if (!targetCol || dragged.status === targetCol) return;
    const updated = { ...dragged, status: targetCol };
    await updateJob(updated);
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }

  /* import / export */
  function handleExport() { downloadJson(jobs, `job-tracker-${today()}.json`); }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("bad format");
        await importJobs(data);
        setJobs(await getAllJobs());
      } catch {
        alert("Invalid JSON backup file.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          {/* brand */}
          <div className="flex items-center gap-2 mr-1 shrink-0">
            <span className="text-xl">🗂️</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">Job Tracker</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{jobs.length} jobs</span>
          </div>

          {/* search */}
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              placeholder="Search company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {/* actions */}
          <div className="flex items-center gap-2 ml-auto">
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <button onClick={() => importRef.current.click()} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Import
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Export
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => { setEditJob(null); setShowForm(true); }}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              + Add Job
            </button>
          </div>
        </div>
      </header>

      {/* kanban board */}
      <main className="px-4 py-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                jobs={byColumn[col.id] || []}
                onEdit={(job) => { setEditJob(job); setShowForm(true); }}
                onDelete={setDeleteTarget}
                sortOrder={sortOrder}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeJob ? (
              <div className="rotate-1 scale-105 w-72 shadow-2xl">
                <JobCard job={activeJob} onEdit={() => {}} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* modals */}
      {showForm && (
        <JobForm
          initial={editJob}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditJob(null); }}
          resumeNames={resumeNames}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.company} — ${deleteTarget.role}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
