import { redirect } from "next/navigation";

// La ruta anterior del módulo se mantiene para enlaces guardados.
export default function SimuladorRedirect() {
    redirect("/presupuesto");
}
