import { cn } from "@/lib/utils";

const SIMBOLO_PATH =
  "M -21.79 -22.29 L -12.22 -28.67 Q -4.73 -33.67 3.84 -30.93 L 14.80 -27.43 Q 23.37 -24.69 26.58 -16.28 L 30.67 -5.53 Q 33.88 2.88 29.30 10.63 L 23.45 20.53 Q 18.87 28.28 9.96 29.53 L -1.43 31.14 Q -10.35 32.39 -16.88 26.20 L -25.24 18.29 Q -31.77 12.11 -31.01 3.14 L -30.04 -8.33 Q -29.27 -17.29 -21.79 -22.29 Z " +
  "M 12.90 -16.68 L 20.30 -2.17 Q 23.02 3.18 17.68 5.90 L 3.17 13.30 Q -2.18 16.02 -4.90 10.68 L -12.30 -3.83 Q -15.02 -9.18 -9.68 -11.90 L 4.83 -19.30 Q 10.18 -22.02 12.90 -16.68 Z";

interface SimboloVidenasProps {
  className?: string;
}

export function SimboloVidenas({ className }: SimboloVidenasProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand-700", className)}
      role="img"
      aria-label="Símbolo Videnas"
    >
      <g transform="translate(40 40)">
        <path d={SIMBOLO_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  );
}

interface LogoVidenasProps {
  className?: string;
}

export function LogoVidenas({ className }: LogoVidenasProps) {
  return (
    <svg
      viewBox="0 0 240 60"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand-700", className)}
      role="img"
      aria-label="Videnas"
    >
      <g transform="translate(30 30) scale(0.56)">
        <path d={SIMBOLO_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <text
        x={58}
        y={30}
        dominantBaseline="central"
        fontFamily="var(--font-family-display), Quicksand, sans-serif"
        fontSize={30}
        fontWeight={700}
        fill="currentColor"
        letterSpacing="-0.01em"
      >
        Videnas
      </text>
    </svg>
  );
}
