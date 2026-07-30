type ReceptionGuestsPieChartProps = {
  total: number;
  arrived: number;
  notArrived: number;
  totalLabel: string;
};

export function ReceptionGuestsPieChart({
  total,
  arrived,
  notArrived,
  totalLabel,
}: ReceptionGuestsPieChartProps) {
  const radius = 42;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const arrivedRatio = total > 0 ? arrived / total : 0;
  const arrivedLength = arrivedRatio * circumference;
  const notArrivedLength = circumference - arrivedLength;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        {total > 0 ? (
          <>
            <circle
              cx="50"
              cy="50"
              r={normalizedRadius}
              fill="none"
              stroke="rgb(239 68 68 / 0.35)"
              strokeWidth={stroke}
              strokeDasharray={`${notArrivedLength} ${circumference}`}
              strokeDashoffset={-arrivedLength}
              strokeLinecap="butt"
            />
            <circle
              cx="50"
              cy="50"
              r={normalizedRadius}
              fill="none"
              stroke="rgb(52 211 153 / 0.85)"
              strokeWidth={stroke}
              strokeDasharray={`${arrivedLength} ${circumference}`}
              strokeLinecap="butt"
            />
          </>
        ) : (
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            fill="none"
            stroke="rgb(201 162 39 / 0.25)"
            strokeWidth={stroke}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-semibold text-gold-light">{total}</p>
        <p className="mt-1 text-xs text-muted">{totalLabel}</p>
      </div>
    </div>
  );
}
