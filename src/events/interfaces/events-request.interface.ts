import { FilterRequest } from "../../common/interfaces";

export interface EventsRequest {
    accounts?: number[];
    ignoreEmpty?: boolean;
    state?: number;
    dateStart?: string;
    dateEnd?: string;
    startQuery?: string;
    endQuery?: string;
    exclude?: boolean;
    scheduled?: boolean;
    comments?: boolean;
    partitions?: boolean;
    filter?: FilterRequest[];
    order?: number;
}