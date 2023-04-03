import { FilterRequest } from "../../common/interfaces";

export interface EventsTopGroupRequest {
    typeAccount: number;
    accounts: number[];
    top?: number;
    state?: number;
    exclude?: boolean;
    partitions?: boolean;
    filter?: FilterRequest[];
}