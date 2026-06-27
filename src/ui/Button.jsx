export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#1a6b32] text-white hover:bg-green-800 focus:ring-[#1a6b32]",
    secondary:
      "bg-green-50 text-[#1a6b32] hover:bg-green-100 focus:ring-green-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200",
    outline:
      "border-2 border-gray-200 text-gray-700 hover:border-[#1a6b32] hover:text-[#1a6b32] focus:ring-[#1a6b32]",
    ghost:
      "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
