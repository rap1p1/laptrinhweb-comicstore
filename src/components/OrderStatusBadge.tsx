const orderStatuses: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Chờ vận chuyển", color: "bg-blue-50 text-blue-800 border-blue-200" },
  SHIPPING: { label: "Đang giao hàng", color: "bg-orange-50 text-orange-800 border-orange-200" },
  DELIVERED: { label: "Đã nhận hàng", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn đơn", color: "bg-purple-50 text-purple-800 border-purple-200" },
  RETURNED: { label: "Đã hoàn đơn", color: "bg-neutral-100 text-neutral-700 border-neutral-300" },
  REJECTED: { label: "Từ chối nhận", color: "bg-rose-50 text-rose-800 border-rose-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

export default function OrderStatusBadge({ status, label }: { status: string; label?: string }) {
  const display = orderStatuses[status];
  const color = display?.color || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${color}`}>
      {label || display?.label || status}
    </span>
  );
}
