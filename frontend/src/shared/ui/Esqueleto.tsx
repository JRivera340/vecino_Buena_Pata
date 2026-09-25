import { cx } from './clases';

export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'animate-brillo rounded bg-[#f0f0f0] bg-[linear-gradient(90deg,#f0f0f0_25%,#e4e4e4_50%,#f0f0f0_75%)] bg-[length:200%_100%]',
        className ?? 'h-3 w-4/5',
      )}
    />
  );
}
