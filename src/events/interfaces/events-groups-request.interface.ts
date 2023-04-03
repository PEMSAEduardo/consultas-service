import { FilterRequest } from "src/common/interfaces";

export interface EventsGroupsRequest {
    typeAccount?: number;
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