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
            <Link href="/web/nosotros">Nosotros</Link>
          </li>
          <li>
            <Link href="/web/productos">Productos</Link>
          </li>
          <li>
            <Link href="/web/promociones">Promociones</Link>
          </li>
          <li>
            <Link href="/app">App</Link>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
