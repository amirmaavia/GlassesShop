import Image from 'next/image';

export function BrandLogo() {
  return (
    <span className="brand-logo">
      <Image src="/aure-optics-logo-trimmed.png" alt="Auré Optics" width={441} height={493} sizes="(max-width: 650px) 56px, 80px" />
    </span>
  );
}
