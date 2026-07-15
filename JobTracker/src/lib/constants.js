export const COLUMNS = [
  { id: "wishlist",   label: "Wishlist",   accent: "border-slate-400",  bg: "bg-slate-50 dark:bg-slate-800/40"  },
  { id: "applied",    label: "Applied",    accent: "border-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20"   },
  { id: "followup",   label: "Follow-up",  accent: "border-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20"},
  { id: "interview",  label: "Interview",  accent: "border-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20"},
  { id: "offer",      label: "Offer",      accent: "border-green-400",  bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "rejected",   label: "Rejected",   accent: "border-red-400",    bg: "bg-red-50 dark:bg-red-900/20"    },
];

export const COLUMN_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c]));

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];
