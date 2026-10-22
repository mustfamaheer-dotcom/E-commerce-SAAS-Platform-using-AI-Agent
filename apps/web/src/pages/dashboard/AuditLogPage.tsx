// apps/web/src/pages/dashboard/AuditLogPage.tsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, X, Code2 } from 'lucide-react';

export interface AuditActionItem {
  id: string;
  tenantId: string;
  toolName: string;
  params: Record<string, any>;
  status: 'EXECUTED' | 'PENDING_CONFIRMATION' | 'REJECTED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

interface AuditLogPageProps {
  tenantId?: string;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ tenantId }) => {
  const [actions, setActions] = useState<AuditActionItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTool, setFilterTool] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<AuditActionItem | null>(null);

  const activeTid = tenantId || 'tenant-moustafa-tech';

  useEffect(() => {
    fetch(`http://127.0.0.1:8001/api/v1/orders/audit-logs?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setActions(data);
      })
      .catch(() => {});
  }, [tenantId]);

  const uniqueTools = Array.from(new Set(actions.map((a) => a.toolName)));

  const filtered = actions.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterTool !== 'ALL' && item.toolName !== filterTool) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXECUTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80';
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>سجل عمليات وتدقيق المنصة (Audit Trail)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل غير قابل للتعديل (Immutable) لجميع عمليات تحديث الطلبات واستدعاءات أدوات النظام
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">تصفية حسب الحالة:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="EXECUTED">EXECUTED (منفذة بنجاح)</option>
            <option value="PENDING_CONFIRMATION">PENDING (بانتظار التأكيد)</option>
            <option value="REJECTED">REJECTED (مرفوضة)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">تصفية حسب العملية:</span>
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">جميع العمليات</option>
            {uniqueTools.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
              <th className="p-3 font-semibold">المعرف (ID)</th>
              <th className="p-3 font-semibold">العملية / الأداة</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold">التاريخ والوقت</th>
              <th className="p-3 font-semibold">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  لا توجد سجلات تدقيق مسجلة حالياً لمتجرك.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-medium text-slate-700 dark:text-slate-300">{item.id}</td>
                  <td className="p-3 font-mono text-sky-600 dark:text-sky-400">{item.toolName}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-medium border text-[11px] ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{item.createdAt}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedAction(item)}
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>عرض التفاصيل</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal / Flyout for Detailed Parameters */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  تفاصيل العملية: {selectedAction.toolName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500">ID: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedAction.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">الحالة: </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedAction.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">الوقت: </span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedAction.createdAt}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  معاملات الاستدعاء (Parameters):
                </label>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto border border-slate-800 font-mono">
                  {JSON.stringify(selectedAction.params, null, 2)}
                </pre>
              </div>

              {selectedAction.errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-[11px] font-sans">
                  <span className="font-semibold block mb-0.5">رسالة الخطأ / الحظر:</span>
                  {selectedAction.errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
