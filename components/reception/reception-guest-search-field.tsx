function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export function ReceptionGuestSearchField({
  value,
  onChange,
  placeholder,
  onFocus,
  ariaExpanded,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onFocus?: () => void;
  ariaExpanded?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-4 top-1/2 z-10 -translate-y-1/2 text-gold-muted">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="surface-card w-full rounded-2xl py-3.5 pe-4 ps-12 text-sm text-gold-light outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/40"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={ariaExpanded}
      />
    </div>
  );
}
