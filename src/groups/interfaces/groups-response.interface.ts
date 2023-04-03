import { AccountResponse } from "../../accounts/interfaces";

export interface GroupsResponse {

    Codigo: number;
    Nombre: string;
    Tipo: number;
    accounts?: AccountResponse[];
}