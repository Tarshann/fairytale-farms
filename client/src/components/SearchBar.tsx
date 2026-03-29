import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({
  placeholder = "Search products...",
  className = "",
  onClose,
}: SearchBarProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  const { data: results, isFetching } = trpc.search.products.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2,
      placeholderData: (prev: any) => prev,
    }
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (slug: string) => {
      setQuery("");
      setOpen(false);
      navigate(`/products/${slug}`);
      onClose?.();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      onClose?.();
    }
    if (e.key === "Enter" && debouncedQuery.length >= 2) {
      // Navigate to products page with search param
      navigate(`/products?search=${encodeURIComponent(debouncedQuery)}`);
      setOpen(false);
      onClose?.();
    }
  };

  const showDropdown = open && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8"
          autoComplete="off"
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full bg-background border rounded-lg shadow-lg overflow-hidden"
        >
          {isFetching ? (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : !results || results.length === 0 ? (
            <div className="py-4 px-4 text-sm text-muted-foreground text-center">
              No products found for "{debouncedQuery}"
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y">
              {results.map(product => (
                <li key={product.id}>
                  <button
                    type="button"
                    role="option"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleSelect(product.slug)}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted shrink-0 flex items-center justify-center">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.description.slice(0, 60)}
                          {product.description.length > 60 ? "…" : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${parseFloat(product.basePrice).toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
              {results.length >= 20 && (
                <li>
                  <button
                    type="button"
                    className="w-full py-2.5 text-xs text-center text-primary hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      navigate(`/products?search=${encodeURIComponent(debouncedQuery)}`);
                      setOpen(false);
                      onClose?.();
                    }}
                  >
                    View all results →
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
