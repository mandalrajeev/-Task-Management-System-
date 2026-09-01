const STATUS_LABELS = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done'
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

export function StatusTag({ status }) {
  return <span className={`tag tag-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

export function PriorityTag({ priority }) {
  return <span className={`tag tag-${priority}`}>{PRIORITY_LABELS[priority] || priority}</span>;
}

export { STATUS_LABELS, PRIORITY_LABELS };
