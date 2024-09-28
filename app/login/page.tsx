import { Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center p-4 bg-primary text-primary-foreground">
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="flex items-center space-x-4">
                <Sparkles className="h-6 w-6" />
              </Link>
            </li>
            <li>
              <Link href="/promociones" className="hover:underline">
                Promociones
              </Link>
            </li>
            <li>
              <Link href="/productos" className="hover:underline">
                Productos
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow flex">
        <div className="hidden md:block md:w-1/2 relative">
          <Image
            src="/images/login-hero.svg"
            alt="Hero image"
            fill
            sizes="50vw"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <h2 className="text-2xl font-semibold text-center">
              Bienvenido a Normacolor
            </h2>

            <form className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Correo
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Link
              </Button>
            </form>

            <div className="relative">
              <Separator className="my-8" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                O continua con
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline">Google</Button>
              <Button variant="outline">Twitter</Button>
              <Button variant="outline">Instagram</Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 bg-muted text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Normacolor Panama S.A. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
