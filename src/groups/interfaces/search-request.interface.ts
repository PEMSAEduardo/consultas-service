import { Group } from "./group.interface";

export interface SearchRequest {
    groups?: Group[];
    showAccounts?: boolean;
    zones?: boolean;
    partitions?: boolean;
    users?: boolean;
    contacts?: boolean;
    panel?: boolean;
    security?: boolean;
    generalData?: boolean;
    deviceZone?: boolean;
    state?: number;
}
