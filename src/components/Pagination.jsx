import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";

export function Pagination({ from, to, total, onPrev, onNext }) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
      <span>
        Mostrando {from} a {to} de {total} registros
      </span>
      <div className="flex gap-2">
        <Button variant="outline" className="p-2" onClick={onPrev}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" className="p-2" onClick={onNext}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
