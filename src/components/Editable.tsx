import { useEffect, useRef, useState } from "react";

interface EditableNumberProps {
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  format?: "brl" | "num" | "raw";
  className?: string;
}

function formatValue(v: number, format: "brl" | "num" | "raw") {
  if (format === "brl") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
  if (format === "num") return new Intl.NumberFormat("pt-BR").format(v || 0);
  return String(v ?? 0);
}

export function EditableNumber({ value, onChange, prefix, suffix, format = "num", className = "" }: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
  useEffect(() => { setDraft(String(value ?? 0)); }, [value]);

  const commit = () => {
    const n = Number(String(draft).replace(/\./g, "").replace(",", ".")) || 0;
    onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`w-full bg-transparent border-b border-primary outline-none num-tabular ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`text-left num-tabular hover:bg-accent/40 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Clique para editar"
    >
      {prefix}{formatValue(value, format)}{suffix}
    </button>
  );
}

export function EditableText({
  value, onChange, placeholder, multiline, className = "",
}: { value: string; onChange: (s: string) => void; placeholder?: string; multiline?: boolean; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing) {
    const commonProps = {
      value: draft,
      onChange: (e: any) => setDraft(e.target.value),
      onBlur: () => { onChange(draft); setEditing(false); },
      autoFocus: true,
      className: `w-full bg-transparent border border-border rounded px-2 py-1 outline-none focus:border-primary ${className}`,
    };
    return multiline ? <textarea rows={3} {...commonProps} /> : <input {...commonProps} />;
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`text-left hover:bg-accent/40 rounded px-1 -mx-1 transition-colors w-full ${className}`}
    >
      {value || <span className="text-muted-foreground italic">{placeholder || "Clique para editar"}</span>}
    </button>
  );
}
