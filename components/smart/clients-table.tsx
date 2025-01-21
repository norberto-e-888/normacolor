import { MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/database";
import { formatNumber } from "@/utils";

interface ClientsTableProps {
  clients: User[];
  selectedClientId?: string;
  onClientSelect: (client: User) => void;
  onClientUpdate: () => void;
}

export function ClientsTable({
  clients,
  selectedClientId,
  onClientSelect,
  onClientUpdate,
}: ClientsTableProps) {
  const handleDelete = async (client: User) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${client.email}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      toast.success("Cliente eliminado exitosamente");
      onClientUpdate();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b bg-muted/50">
          <TableHeader columnName="Email" />
          <TableHeader columnName="Puntos" />
          <TableHeader columnName="Total Gastado" />
          <TableHeader columnName="Acciones" />
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr
            key={client.id}
            className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
              selectedClientId === client.id ? "bg-primary/5" : ""
            }`}
            onClick={() => onClientSelect(client)}
          >
            <td className="p-4">{client.email}</td>
            <td className="p-4">{formatNumber(client.unspentLoyaltyPoints)}</td>
            <td className="p-4">
              ${(client.totalSpentCents / 100).toFixed(2)}
            </td>
            <td className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(client);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableHeader({ columnName }: { columnName: string }) {
  return <th className="text-left p-4 font-medium">{columnName}</th>;
}
