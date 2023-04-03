import { Injectable } from '@nestjs/common';
import { DbService } from 'src/common/db/db.service';
import { GroupRequest, GroupsRequest, GroupsResponse, SearchRequest } from './interfaces';
import { AccountsService } from 'src/accounts/accounts.service';
import { Group } from '../common/interfaces';
import { AccountResponse } from '../accounts/interfaces';


@Injectable()
export class GroupsService {
    constructor(
        private readonly dbService: DbService,
        private readonly accountsService: AccountsService,
    ) { }

    async getGroup(data: GroupRequest): Promise<GroupsResponse> {
        if (data.group.type === 2) { // Es un grupo de monitoring works
            const group = await this.dbService.getGroups([data.group.id], data.showAccounts);

            // ? Verificar si se pidieron las cuentas
            if (data.showAccounts) {
                const dataToSend = { // * Data para enviar al cliente
                    Codigo: group[0].Codigo,
                    Nombre: group[0].Nombre,
                    Tipo: 2,
                }

                const accounts = group.map(gr => Number(gr.CodigoCte));

                const respAccounts = await this.accountsService.searchAccounts({ ...data, accounts });
                return {
                    ...dataToSend,
                    accounts: respAccounts
                }
            }
            return {
                Codigo: group[0].Codigo,
                Nombre: group[0].Nombre,
                Tipo: 2,
            }


        } else { // Es un dealer de monitoring works
            const group = await this.dbService.getDealers([data.group.id], data.showAccounts);
            // ? Verificar si se pidieron las cuentas
            if (data.showAccounts) {
                const dataToSend = { // * Data para enviar al cliente
                    Codigo: group[0].Codigo,
                    Nombre: group[0].Nombre,
                    Tipo: 3,
                }

                const accounts = group.map(gr => Number(gr.CodigoCte));

                const respAccounts = await this.accountsService.searchAccounts({ ...data, accounts });

                return {
                    ...dataToSend,
                    accounts: respAccounts
                }
            }
            return {
                Codigo: group[0].Codigo,
                Nombre: group[0].Nombre,
                Tipo: 3,
            }
        }
    }

    async allGroups(data: GroupsRequest): Promise<GroupsResponse[]> {
        
        const [groups, dealers] = await Promise.all([
            this.dbService.getGroups([], data.showAccounts),
            this.dbService.getDealers([], data.showAccounts)
        ]);
        if (data.showAccounts) {
            // ? Obtener todas las cuentas y unificarlas
            const allAccounts = Array.from(new Set([
                ...groups.map(group => Number(group.CodigoCte)),
                ...dealers.map(dealer => Number(dealer.CodigoCte))
            ]));
            const respAccounts = await this.accountsService.searchAccounts({ ...data, accounts: allAccounts });

            // ? Obtener todos los grupos (Sin cuentas)
            let hash = {};
            const allGroups = groups.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
            const formatGroups = allGroups.map(group => {
                const accountsFromGroup = groups.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);
                const dataAccounts = accountsFromGroup.reduce((result: AccountResponse[], item) => {
                    if(respAccounts.find(account => account.CodigoCte === item)) result = [...result, respAccounts.find(account => account.CodigoCte === item)]
                    return result;
                }, []);

                return {
                    Codigo: group.Codigo,
                    Nombre: group.Nombre,
                    Tipo: 2,
                    accounts: dataAccounts
                }
            });

            // ? Obtener todos los dealer (Sin cuentas)
            hash = {};
            const allDealers = dealers.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
            const formatDealers = allDealers.map(group => {
                const accountsFromGroup = dealers.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);
                const dataAccounts = accountsFromGroup.reduce((result: AccountResponse[], item) => {
                    if(respAccounts.find(account => account.CodigoCte === item)) result = [...result, respAccounts.find(account => account.CodigoCte === item)]
                    return result;
                }, []);
                return {
                    Codigo: group.Codigo,
                    Nombre: group.Nombre,
                    Tipo: 3,
                    accounts: dataAccounts
                }
            });

            // ? Separar los grupos 
            return [
                ...formatGroups,
                ...formatDealers
            ]
        }

        return [
            ...groups.map((group) => ({ ...group, Tipo: 2 })), ...dealers.map(dealer => ({ ...dealer, Tipo: 3 }))
        ]
    }

    async searchGroups(data: SearchRequest): Promise<GroupsResponse[]> {
        const acGroups = data.groups.filter(group => group.type === 2).map(gr => gr.id);
        const acDealers = data.groups.filter(group => group.type === 3).map(gr => gr.id);

        const [groups, dealers]: [Array<Group>, Array<Group>] = await Promise.all([
            (acGroups.length === 0) ? [] : this.dbService.getGroups(acGroups, data.showAccounts),
            (acDealers.length === 0) ? [] : this.dbService.getDealers(acDealers, data.showAccounts)
        ]);

        if (data.showAccounts) {
            // ? Obtener todas las cuentas y unificarlas
            const allAccounts = Array.from(new Set([
                ...groups.map(group => Number(group.CodigoCte)),
                ...dealers.map(dealer => Number(dealer.CodigoCte))
            ]));
            const respAccounts = await this.accountsService.searchAccounts({ ...data, accounts: allAccounts });

            // ? Obtener todos los grupos (Sin cuentas)
            let hash = {};
            const allGroups = groups.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
            const formatGroups = allGroups.map(group => {
                const accountsFromGroup = groups.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);                
                const dataAccounts = accountsFromGroup.reduce((result: AccountResponse[], item) => {
                    if(respAccounts.find(account => account.CodigoCte === item)) result = [...result, respAccounts.find(account => account.CodigoCte === item)]
                    return result;
                }, []);
                return {
                    Codigo: group.Codigo,
                    Nombre: group.Nombre,
                    Tipo: 2,
                    accounts: dataAccounts
                }
            });

            // ? Obtener todos los dealer (Sin cuentas)
            hash = {};
            const allDealers = dealers.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
            const formatDealers = allDealers.map(group => {
                const accountsFromGroup = dealers.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);
                const dataAccounts = accountsFromGroup.reduce((result: AccountResponse[], item) => {
                    if(respAccounts.find(account => account.CodigoCte === item)) result = [...result, respAccounts.find(account => account.CodigoCte === item)]
                    return result;
                }, []);
                return {
                    Codigo: group.Codigo,
                    Nombre: group.Nombre,
                    Tipo: 3,
                    accounts: dataAccounts
                }
            });

            // ? Separar los grupos 
            return [
                ...formatGroups,
                ...formatDealers
            ]
        }

        return [...groups.map((group) => ({ ...group, Tipo: 2, accounts: [] })), ...dealers.map(dealer => ({ ...dealer, Tipo: 3, accounts: [] }))]
        
    }

    // TODO Verficar uso
    async getIndividualAccounts(codes: number[], type: number) {
        if (type === 2) { // grupo
            const groups = await this.dbService.getGroups(codes, true);
            let hash = {};
            const allGroups = groups.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
            const formatgroups = allGroups.map(group => {
                const accountsFromGroup = groups.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);
                return {
                    Codigo: group.Codigo,
                    Nombre: group.Nombre,
                    Tipo: 3,
                    accounts: accountsFromGroup
                }
            });
            return formatgroups;
        }
        // Dealer
        const dealers = await this.dbService.getDealers(codes, true);
        let hash = {};
        const allDealers = dealers.filter(o => hash[o.Codigo] ? false : hash[o.Codigo] = true);
        const formatDealers = allDealers.map(group => {
            const accountsFromGroup = dealers.filter(gr => gr.Codigo === group.Codigo).map(gr => gr.CodigoCte);
            return {
                Codigo: group.Codigo,
                Nombre: group.Nombre,
                Tipo: 3,
                accounts: accountsFromGroup
            }
        });
        return formatDealers;
    }

}
