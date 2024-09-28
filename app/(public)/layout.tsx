import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex gap-4 items-center p-4 bg-primary text-primary-foreground">
        <Link href="/login" className="flex gap-1 items-center">
          <Sparkles className="h-6 w-6" />
          <span className="text-lg font-bold">Normacolor</span>
        </Link>

        <Link href="/productos">
          <span className="text-lg">Productos</span>
        </Link>

        <Link href="/promociones">
          <span className="text-lg">Promociones</span>
        </Link>
      </nav>

      {children}
    </div>
  );
}
