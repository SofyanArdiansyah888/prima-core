export default function PkmLogo({ className = 'size-12' }: { className?: string }) {
  return (
    <img
      src="/logo-pkm.svg"
      alt="Logo PT. Prima Karya Manunggal Semen Tonasa"
      className={`${className} object-contain shrink-0`}
    />
  );
}
