import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { daysSince } from "../lib/utils";
import { COLUMN_MAP } from "../lib/constants";

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function JobCard({ job, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const col = COLUMN_MAP[job.status];
  const days = daysSince(job.dateApplied);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 ${col.accent} border border-slate-100 dark:border-slate-700 p-4 cursor-grab active:cursor-grabbing select-none`}
      {...attributes}
      {...listeners}
    >
      {/* actions — visible on hover */}
      <div className="absolute top-3 right-3 hidden group-hover:flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(job)}
          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
        <button
          onClick={() => onDelete(job)}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight pr-10 truncate">{job.company}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.role}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.resume && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
            {job.resume}
          </span>
        )}
        {job.salary && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{job.salary}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {days === null ? "—" : days === 0 ? "Today" : `${days}d ago`}
        </span>
        {job.linkedinUrl && (
          <a
            href={job.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="Open job posting"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <LinkedInIcon />
          </a>
        )}
      </div>
    </div>
  );
}
