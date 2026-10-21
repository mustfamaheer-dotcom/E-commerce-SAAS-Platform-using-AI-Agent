// apps/web/src/pages/dashboard/AuditLogPage.tsx
import React, { useState } from 'react';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">سجل عمليات الوكيل الذكي (Audit Log)</h1>
          <p className="text-sm text-slate-500">
            سجل غير قابل للتعديل (Immutable) لجميع استدعاءات الأدوات والعمليات الحساسة
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-sm">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">تصفية حسب الحالة:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white block text-xs"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="EXECUTED">EXECUTED</option>
            <option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">تصفية حسب الأداة:</label>
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white block text-xs"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3">معرّف العملية</th>
              <th className="p-3">اسم الأداة (Tool)</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">الوقت والتاريخ</th>
              <th className="p-3">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono font-semibold text-slate-800">{item.id}</td>
                <td className="p-3 font-mono text-indigo-700">{item.toolName}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{item.createdAt}</td>
                <td className="p-3">
                  <button
                    onClick={() => setSelectedAction(item)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
                  >
                    عرض المعاملات (JSON)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Drawer Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">تفاصيل العملية {selectedAction.id}</h3>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-slate-500">الأداة: </span>
                <span className="font-mono font-bold text-slate-800">{selectedAction.toolName}</span>
              </div>
              <div>
                <span className="text-slate-500">الحالة: </span>
                <span className="font-bold text-slate-800">{selectedAction.status}</span>
              </div>
              {selectedAction.errorMessage && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded border border-rose-200">
                  {selectedAction.errorMessage}
                </div>
              )}
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">المعاملات (Payload):</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto font-mono">
                  {JSON.stringify(selectedAction.params, null, 2)}
                </pre>
              </div>
            </div>

            <div className="text-left pt-2">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
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
