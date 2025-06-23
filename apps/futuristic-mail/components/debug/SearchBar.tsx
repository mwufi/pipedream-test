import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ placeholder, value, onChange }: SearchBarProps) {
  return (
    <div className="p-4 border-b border-white/10 w-full">
      <div className="relative max-w-[60rem]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
        />
      </div>
    </div>
  );
}