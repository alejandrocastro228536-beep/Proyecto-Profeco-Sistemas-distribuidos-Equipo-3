"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  onSearch?: (query: string) => void;
  onSubmit?: (query: string) => void;
  className?: string;
  showButton?: boolean;
}

export interface SearchBarHandle {
  clear: () => void;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBar(
    {
      initialValue = "",
      placeholder = "Busca leche, arroz, aceite...",
      autoFocus,
      debounceMs = 350,
      onSearch,
      onSubmit,
      className,
      showButton = true,
    },
    ref,
  ) {
    const [value, setValue] = useState(initialValue);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastEmittedRef = useRef<string>(initialValue);

    useImperativeHandle(ref, () => ({
      clear: () => {
        setValue("");
        lastEmittedRef.current = "";
        onSearch?.("");
      },
    }));

    useEffect(() => {
      if (!onSearch) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (value !== lastEmittedRef.current) {
          lastEmittedRef.current = value;
          onSearch(value.trim());
        }
      }, debounceMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [value, debounceMs, onSearch]);

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (timerRef.current) clearTimeout(timerRef.current);
        onSubmit?.(value.trim());
      },
      [value, onSubmit],
    );

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full items-center gap-2",
          className,
        )}
        role="search"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="h-12 pl-10 pr-10 text-base"
            aria-label="Buscar productos"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {showButton && (
          <Button type="submit" size="lg" className="h-12 px-6">
            Buscar
          </Button>
        )}
      </form>
    );
  },
);
