interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-white/20 border-t-brand-500 ${SIZES[size]}`}
      role="status"
      aria-label="Carregando"
    />
  );
}
