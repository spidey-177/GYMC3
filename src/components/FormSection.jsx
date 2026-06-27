export function FormSection({ title, step, headerRight, children }) {
  const hasComplexHeader = step !== undefined || headerRight !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      {hasComplexHeader ? (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          {step !== undefined && (
            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {step}
            </div>
          )}
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {headerRight && <div className="ml-auto">{headerRight}</div>}
        </div>
      ) : (
        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
