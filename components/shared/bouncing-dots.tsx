export function BouncingDots({ label = "Đang xử lý" }: { label?: string }) {
  return <span className="bouncing-dots" role="status" aria-label={label}><i /><i /><i /></span>;
}
