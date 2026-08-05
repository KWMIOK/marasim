import { AppSwitch } from "@/components/shared/app-switch";

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  const fieldId = id ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <label
      htmlFor={fieldId}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border-gold bg-transparent px-4 py-3"
    >
      <div>
        <span className="text-sm font-medium text-gold-light">{label}</span>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <AppSwitch id={fieldId} checked={checked} onChange={onChange} aria-label={label} />
    </label>
  );
}
