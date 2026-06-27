export function Badge({ children, variant = "gray", className = "" }) {
  const variants = {
    green: "bg-green-100 text-green-800 border border-green-200",
    red: "bg-red-100 text-red-800 border border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    amber: "bg-amber-100 text-amber-800 border border-amber-200",
    gray: "bg-gray-100 text-gray-800 border border-gray-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
