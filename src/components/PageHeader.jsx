import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PageHeader({ title, subtitle, backTo, badge, actions }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-2 text-gray-500 hover:text-[#1a6b32] hover:bg-green-50 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
