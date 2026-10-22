// apps/web/src/pages/dashboard/AuditLogPage.tsx
import React, { useState } from 'react';
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

const MOCK_ACTIONS: AuditActionItem[] = [
  {
    id: 'act_001',
    tenantId: 'tenant-demo-01',
    toolName: 'create_promotion_for_segment',
    params: { segment: 'At-Risk of Churn', discountPct: 15, durationDays: 7, code: 'WINBACK15' },
    status: 'EXECUTED',
    createdAt: '2026-10-21 21:40:12',
  },
  {
    id: 'act_002',
    tenantId: 'tenant-demo-01',
    toolName: 'bulk_update_prices',
    params: { category: 'Speakers', multiplier: 1.05, affected_skus: 4 },
    status: 'EXECUTED',
    createdAt: '2026-10-21 20:15:30',
  },
  {
    id: 'act_003',
    tenantId: 'tenant-demo-01',
    toolName: 'drop_table_attempt',
    params: { statement: 'DROP TABLE customers' },
    status: 'REJECTED',
    errorMessage: 'SecurityGuardrailTriggered: DDL/DML statements forbidden.',
    createdAt: '2026-10-21 19:05:44',
  },
  {
    id: 'act_004',
    tenantId: 'tenant-demo-01',
    toolName: 'run_sales_forecast',
    params: { product_id: 'prod_101', horizon_days: 30 },
    status: 'EXECUTED',
    createdAt: '2026-10-21 18:22:10',
  },
  {
    id: 'act_005',
    tenantId: 'tenant-demo-01',
    toolName: 'create_store_tenant',
    params: { store_name: 'TechZone Cairo', currency: 'EGP' },
    status: 'EXECUTED',
    createdAt: '2026-10-21 17:50:00',
  },
];

export const AuditLogPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTool, setFilterTool] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<AuditActionItem | null>(null);

  const filtered = MOCK_ACTIONS.filter((item) => {
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
    <div className="space-y-5 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>سجل عمليات وتدقيق الوكيل الذكي (Audit Log)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل غير قابل للتعديل (Immutable) لجميع استدعاءات الأدوات وعمليات التحليل وتعديل الأسعار
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">تصفية حسب الحالة:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="EXECUTED">EXECUTED</option>
            <option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">تصفية حسب الأداة:</span>
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">جميع الأدوات</option>
            <option value="create_promotion_for_segment">create_promotion_for_segment</option>
            <option value="bulk_update_prices">bulk_update_prices</option>
            <option value="run_sales_forecast">run_sales_forecast</option>
            <option value="drop_table_attempt">drop_table_attempt</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-right">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <tr>
              <th className="p-3 font-medium">معرّف العملية</th>
              <th className="p-3 font-medium">اسم الأداة (Tool)</th>
              <th className="p-3 font-medium">الحالة</th>
              <th className="p-3 font-medium">الوقت والتاريخ</th>
              <th className="p-3 font-medium">المعاملات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => (
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
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Drawer Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-semibold text-xs flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>تفاصيل العملية {selectedAction.id}</span>
              </h3>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">الأداة: </span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-medium">{selectedAction.toolName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">الحالة: </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedAction.status}</span>
              </div>
              {selectedAction.errorMessage && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800/80 text-[11px]">
                  {selectedAction.errorMessage}
                </div>
              )}
              <div className="pt-2">
                <span className="text-slate-500 dark:text-slate-400 block mb-1 text-[11px]">المعاملات (Payload):</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-md border border-slate-800 text-[11px] overflow-x-auto font-mono">
                  {JSON.stringify(selectedAction.params, null, 2)}
                </pre>
              </div>
            </div>

            <div className="text-left pt-2">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-medium transition-colors"
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
