import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RpcException } from '@nestjs/microservices';
import { DbService } from '../common/db/db.service';
import { Account, Partition, User, Zone, Contact } from '../common/interfaces';
import { AccountRequest, AccountResponse, AccountSend, AccountsRequest, SearchAccountsRequest } from './interfaces';


@Injectable()
export class AccountsService {
  constructor(
    private readonly dbService: DbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async getAccount(data: AccountRequest): Promise<AccountResponse> {
    
    const dataAccount = await this.dbService.getAccounts([data.account.toString()], 0, data.generalData, data.panel, data.security);
    if (dataAccount.length === 0) throw new RpcException('Cuenta no existente');

    let promises = [
      data.partitions ? this.dbService.getPartitions([data.account.toString()]) : null,
      data.zones ? this.dbService.getZones([data.account.toString()], data.deviceZone) : null,
      data.users ? this.dbService.getUsers([data.account.toString()]) : null,
      data.contacts ? this.dbService.getContacts([data.account.toString()]) : null
    ];

    const response = await Promise.all(promises);

    return {
      ...this.separateAccount(dataAccount[0], data.generalData, data.panel, data.security),
      particiones: response[0] ? response[0] as Partition[] : undefined,
      zonas: response[1] ? response[1] as Zone[] : undefined,
      usuarios: response[2] ? response[2] as User[] : undefined,
      contactos: response[3] ? response[3] as Contact[] : undefined,
    };
  }

  async getAllAccounts(data: AccountsRequest): Promise<AccountResponse[]> {

    const stateAccount = data.state
      ? (data.state === 0) ? 'T' : (data.state === 1) ? 'A' : 'I'
      : 'T';

    if (data.zones && data.contacts && data.generalData && data.panel && data.partitions && data.security && data.users) {
    } else {

      const cacheData = await this.cacheManager.get(`all-${stateAccount}`);
      if (cacheData) {
        // @ts-ignore
        return cacheData;
      }
    }

    const dataAccounts = await this.dbService.getAccounts([], data.state || 0, data.generalData, data.panel, data.security);

    if (data.zones && data.contacts && data.generalData && data.panel && data.partitions && data.security && data.users) {
    } else {
      await this.cacheManager.set(`all-${stateAccount}`, dataAccounts, { ttl: 30 });
    }
    let promises: Array<Promise<any>> = [
      data.partitions ? this.dbService.getPartitions([]) : null,
      data.zones ? this.dbService.getZones([], data.deviceZone) : null,
      data.users ? this.dbService.getUsers([]) : null,
      data.contacts ? this.dbService.getContacts([]) : null
    ];

    const response = await Promise.all(promises);

    return dataAccounts.map(account => {
      return {
        ...this.separateAccount(account, data.generalData, data.panel, data.security),
        particiones: response[0] ? response[0].filter(partition => partition.CodigoCte === account.CodigoCte) : null,
        zonas: response[1] ? response[1].filter(zone => zone.CodigoCte === account.CodigoCte) : null,
        usuarios: response[2] ? response[2].filter(user => user.CodigoCte === account.CodigoCte) : null,
        contactos: response[3] ? response[3].filter(contact => contact.CodigoCte === account.CodigoCte) : null
      }
    })


  }

  async searchAccounts(data: SearchAccountsRequest): Promise<AccountResponse[]> {
    const accounts = data.accounts.map( account => account.toString());
    const dataAccounts = await this.dbService.getAccounts(accounts, data.state || 0, data.generalData, data.panel, data.security);

    let promises: Array<Promise<any>> = [
      data.partitions ? this.dbService.getPartitions(accounts) : null,
      data.zones ? this.dbService.getZones(accounts, data.deviceZone) : null,
      data.users ? this.dbService.getUsers(accounts) : null,
      data.contacts ? this.dbService.getContacts(accounts) : null
    ];

    const response = await Promise.all(promises);

    return dataAccounts.map(account => {
      return {
        ...this.separateAccount(account, data.generalData, data.panel, data.security),
        particiones: response[0] ? response[0].filter(partition => partition.CodigoCte === account.CodigoCte) : null,
        zonas: response[1] ? response[1].filter(zone => zone.CodigoCte === account.CodigoCte) : null,
        usuarios: response[2] ? response[2].filter(user => user.CodigoCte === account.CodigoCte) : null,
        contactos: response[3] ? response[3].filter(contact => contact.CodigoCte === account.CodigoCte) : null
      }
    })

  }

  private separateAccount(account: Account, detail: boolean, panel: boolean, security: boolean) {
    const { CodigoAbonado, CodigoCte, CodigoReceptora, Direccion, Nombre, Status } = account;
    let dataStruct: AccountSend = { CodigoAbonado, CodigoCte, CodigoReceptora, Nombre, Direccion, Status };
    if (panel) {
      const { Panel, AccesoPorGPRS, AccesoPorIP, AccesoPorLinea, SinEnlace, CoordGPS } = account;
      dataStruct = { ...dataStruct, panel: { modelo: Panel, AccesoPorGPRS, AccesoPorIP, AccesoPorLinea, SinEnlace, CoordGPS } };
    }
    if (detail) {
      const { Estado, Ubicacion, Municipio } = account;
      dataStruct = { ...dataStruct, datosGeneralesDetallados: { Estado, Ubicacion, Municipio } };
    }
    if (security) {
      const { PalabraDeSeg, PalabraDeSegTA, Amago } = account;
      dataStruct = { ...dataStruct, seguridad: { PalabraDeSeg, PalabraDeSegTA, Amago } }
    }

    return dataStruct;
  }
}
