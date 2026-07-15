import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import JobCard from "./JobCard";

export default function Column({ column, jobs, onEdit, onDelete, sortOrder }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const sorted = [...jobs].sort((a, b) => {
    const da = new Date(a.dateApplied).getTime();
    const db = new Date(b.dateApplied).getTime();
    return sortOrder === "oldest" ? da - db : db - da;
  });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{column.label}</span>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {jobs.length}
        </span>
      </div>

      {/* droppable zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-3 min-h-[120px] transition-colors ${column.bg} ${isOver ? "ring-2 ring-blue-400 ring-inset" : ""}`}
      >
        <SortableContext items={sorted.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {sorted.map((job) => (
              <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </SortableContext>
        {jobs.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4 select-none">Drop cards here</p>
        )}
      </div>
    </div>
  );
}
