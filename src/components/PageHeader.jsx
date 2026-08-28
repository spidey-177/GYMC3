import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PageHeader({ title, subtitle, backTo, badge, actions }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-2 text-gray-500 hover:text-[#1a6b32] hover:bg-green-50 rounded-xl transition-colors shrink-0 mt-0.5 sm:mt-0"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight wrap-break-word">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
