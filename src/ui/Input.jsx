export function Input({ icon: Icon, className = "", ...props }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      {Icon && (
        <Icon
          className="absolute left-3 text-gray-400 pointer-events-none"
          size={20}
        />
      )}
      <input
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#39FF14] focus:ring-4 focus:ring-[#39FF14]/20 outline-none transition-all shadow-sm bg-white`}
        {...props}
      />
    </div>
  );
}
