import { User } from "@/database";
import { formatCents, formatNumber } from "@/utils";

interface ClientDetailProps {
  client: User | null;
}

export function ClientDetail({ client }: ClientDetailProps) {
  if (!client) {
    return (
      <div className="border rounded-lg p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecciona un cliente para ver sus detalles
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold">Detalles del Cliente</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">General</h3>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {client.email}
            </p>
            <p>
              <span className="text-muted-foreground">Nombre:</span>{" "}
              {client.name || "No especificado"}
            </p>
            <p>
              <span className="text-muted-foreground">Fecha de registro:</span>{" "}
              {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Programa de Lealtad</h3>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Puntos disponibles:</span>{" "}
              {formatNumber(client.unspentLoyaltyPoints)}
            </p>
            <p>
              <span className="text-muted-foreground">
                Total de puntos ganados:
              </span>{" "}
              {formatNumber(client.totalLoyaltyPoints)}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Historial de Compras</h3>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Total gastado:</span>{" "}
              {formatCents(client.totalSpentCents)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
