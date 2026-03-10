import Link from 'next/link';

type Props = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="no-underline mono text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
    >
      &larr; {label}
    </Link>
  );
}
