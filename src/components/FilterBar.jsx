export function FilterBar({ children }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
      {children}
    </div>
  );
}
