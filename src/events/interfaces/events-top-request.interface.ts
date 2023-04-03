import { FilterRequest } from "../../common/interfaces";

export interface EventsTopRequest {
    accounts?: number[];
    state?: number;
    exclude?: boolean;
    partitions?: boolean;
    top?: number;
    filter?: FilterRequest[];
}