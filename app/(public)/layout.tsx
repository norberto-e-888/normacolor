import Link from "next/link";

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href="/ingreso">App</Link>
          </li>
          <li>
            <Link href="/nosotros">Nosotros</Link>
          </li>
          <li>
            <Link href="/productos">Productos</Link>
          </li>
          <li>
            <Link href="/promociones">Promociones</Link>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
