import { Injectable } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { DbService } from '../common/db/db.service';
import { CommentSend, Event, EventSimple, EventTop, HorarioSend, Partition } from '../common/interfaces';
import { GroupsService } from 'src/groups/groups.service';
import { EventSend, EventTopSend, EventsGroupsRequest, EventsRequest, EventsWOAccountRequest, EventsTopGroupRequest, EventsTopRequest } from './interfaces';
import { GroupsResponse } from 'src/groups/interfaces';
import { AccountResponse } from 'src/accounts/interfaces';

@Injectable()
export class EventsService {
  constructor(
    private readonly dbService: DbService,
    private readonly accountsService: AccountsService,
    private readonly groupService: GroupsService
  ) { }

  async getEvents(data: EventsRequest) {
    // * Valida que las fechas establecidas en la consulta sean validas 
    const tablesEvents = this.getRangeTableEvent(data.dateStart, data.dateEnd);
    await Promise.all(tablesEvents.map(table => this.dbService.existTable(table)));

    const uniqueAccounts = data.accounts ? data.accounts.map(acc => acc.toString()) : [];
    
    const dataAccounts = await this.accountsService.searchAccounts({ accounts: data.accounts || [], state: data.state || 0 });

    const events = await Promise.all(tablesEvents.map(tableName => this.dbService.getEvents(uniqueAccounts, tableName, data.state || 0, data.filter || [], data.exclude, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59', data.order || 1)));
    const cleanEvents = this.formatEvents(events.flatMap(ev => ev));

    let promises: [Promise<Partition[]>, Promise<CommentSend[]>, Promise<HorarioSend[]>] = [
      data.partitions ? this.dbService.getPartitions(uniqueAccounts) : null,
      data.comments ? this.dbService.getComments(uniqueAccounts, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59') : null,
      data.scheduled ? this.dbService.getScheduled(uniqueAccounts) : null,
    ];

    const [partitions, comments, scheduleds] = await Promise.all(promises);

    return this.responseAccount(dataAccounts, cleanEvents, partitions || [], comments || [], scheduleds || []);

  }

  async getEventsFromGroup(data: EventsGroupsRequest) {

    // * Valida que las fechas establecidas en la consulta sean validas 
    const tablesEvents = this.getRangeTableEvent(data.dateStart, data.dateEnd);
    await Promise.all(tablesEvents.map(table => this.dbService.existTable(table)));

    const groups = await this.groupService.searchGroups({ showAccounts: true, state: data.state || 0, groups: data.accounts.map(id => ({ id, type: data.typeAccount })) });

    const uniqueAccounts = this.uniqueAccounts(groups.flatMap(gr => gr.accounts.map(acc => acc.CodigoCte)));
    
    const events = await Promise.all(tablesEvents.map(tableName => this.dbService.getEvents(uniqueAccounts, tableName, data.state || 0, data.filter || [], data.exclude, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59', data.order || 1)));
    const cleanEvents = this.formatEvents(events.flatMap(ev => ev));    
    
    // ? Sacar mas datos 
    let promises: [Promise<Partition[]>, Promise<CommentSend[]>, Promise<HorarioSend[]>] = [
      data.partitions ? this.dbService.getPartitions(uniqueAccounts) : null,
      data.comments ? this.dbService.getComments(uniqueAccounts, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59') : null,
      data.scheduled ? this.dbService.getScheduled(uniqueAccounts) : null,
    ];

    const [partitions, comments, scheduleds] = await Promise.all(promises);


    return this.responseForGroups(groups, cleanEvents, partitions || [], comments || [], scheduleds || []);
  }

  async getEventsWOAccount(data: EventsWOAccountRequest) {
    // * Valida que las fechas establecidas en la consulta sean validas 
    const tablesEvents = this.getRangeTableEvent(data.dateStart, data.dateEnd);
    await Promise.all(tablesEvents.map(table => this.dbService.existTable(table)));

    const events = await Promise.all(tablesEvents.map(tableName => this.dbService.getEventsWOAccount(tableName, data.state || 0, data.filter || [], data.exclude, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59', data.order || 1)));
    const cleanEvents = this.formatEvents(events.flatMap(ev => ev));

    const uniqueAccounts = Array.from( new Set(cleanEvents.map( ev => ev.CodigoCte)));

    let promises: [Promise<Partition[]>, Promise<CommentSend[]>, Promise<HorarioSend[]>] = [
      data.partitions ? this.dbService.getPartitions(uniqueAccounts) : null,
      data.comments ? this.dbService.getComments(uniqueAccounts, data.dateStart, data.dateEnd, data.startQuery || '00:00', data.endQuery || '23:59') : null,
      data.scheduled ? this.dbService.getScheduled(uniqueAccounts) : null,
    ];

    const [partitions, comments, scheduleds] = await Promise.all(promises);

    
    return this.responseWOAccount(uniqueAccounts, cleanEvents, partitions || [], comments || [], scheduleds || []);

  }

  async getTopEventsGroups(data: EventsTopGroupRequest){
    const groups = await this.groupService.searchGroups({ showAccounts: true, state: data.state || 0, groups: data.accounts.map(id => ({ id, type: data.typeAccount })) });
    
    let uniqueAccounts: Array<AccountResponse> = [];
    const allAccounts = groups.flatMap(gr => gr.accounts);
    
    uniqueAccounts = allAccounts.reduce((resp: Array<AccountResponse>, item) => {
      if(uniqueAccounts.findIndex( account => (account.CodigoAbonado === item.CodigoAbonado && account.CodigoReceptora === item.CodigoReceptora)) === -1){
        resp = [...resp, item];
      }
      return resp;
    }, []);

   
    const partitions = data.partitions ? await this.dbService.getPartitions(uniqueAccounts.map( ac => ac.CodigoCte)) : [];
    const accountsForQuery = uniqueAccounts.flatMap(account => {
      const { CodigoAbonado, CodigoReceptora } = account;
      const accountsPartition = partitions.filter( partition => partition.CodigoCte === account.CodigoCte);
      if(accountsPartition.length === 0){
        return {
          CodigoAbonado,
          CodigoReceptora,
          Particion: -1
        };
      }
      return accountsPartition.flatMap( partition => {
        return{
          CodigoAbonado,
          CodigoReceptora,
          Particion: partition.CodigoParticion
        }
      })
    });    
    
    const events = await this.dbService.getTopEvents(accountsForQuery, data.filter || [], data.exclude || false, data.top || 1);
    const formatEvents = this.formatTopEvents(events);
    
    return this.responseTopForGroups(groups, formatEvents, partitions);
  }

  async getTopEvents(data:EventsTopRequest){
    const unique = data.accounts ? data.accounts.map(acc => acc.toString()) : [];

    const uniqueAccounts = await this.accountsService.searchAccounts({ accounts: data.accounts || [], state: data.state || 0 });
   

    const partitions = data.partitions ? await this.dbService.getPartitions(unique) : [];
    const accountsForQuery = uniqueAccounts.flatMap(account => {
      const { CodigoAbonado, CodigoReceptora } = account;
      const accountsPartition = partitions.filter( partition => partition.CodigoCte === account.CodigoCte);
      if(accountsPartition.length === 0){
        return {
          CodigoAbonado,
          CodigoReceptora,
          Particion: -1
        };
      }
      return accountsPartition.flatMap( partition => {
        return{
          CodigoAbonado,
          CodigoReceptora,
          Particion: partition.CodigoParticion
        }
      })
    });   
    const events = await this.dbService.getTopEvents(accountsForQuery, data.filter || [], data.exclude || false, data.top || 1);
    const formatEvents = this.formatTopEvents(events);

    return this.responseTopAccount(uniqueAccounts, formatEvents, partitions);

  }

  // * Helpers solo para grupos
  private responseForGroups(groups: GroupsResponse[], eventos: EventSend[], partitions: Partition[], comments: CommentSend[], schedules: HorarioSend[]) {
    return groups.map(group => {
      const { accounts, ...rest } = group;
      const eventsForAccount = this.responseAccount(accounts, eventos, partitions, comments, schedules);
      return {
        ...rest,
        cuentas: eventsForAccount
      }
    })
  }
  private responseTopForGroups(groups: GroupsResponse[],eventos: EventTopSend[], partitions: Partition[]){
    return groups.map(group => {
      const { accounts, ...rest } = group;
      const eventsForAccount = this.responseTopAccount(accounts, eventos, partitions);
      return {
        ...rest,
        cuentas: eventsForAccount
      }
    })
  }

  // * Helpers solo para individuales
  private responseAccount(accounts: AccountResponse[], eventos: EventSend[], partitions: Partition[], comments: CommentSend[], schedules: HorarioSend[]) {
    return accounts.flatMap(account => {
      const accountPartitions = partitions.filter(partition => partition.CodigoCte === account.CodigoCte);
      const commentsForAccount = comments.filter(cm => cm.CodigoCliente === account.CodigoCte);
      const scheduledForAccount = schedules.find(sh => sh.CodigoCte === account.CodigoCte);

      if (accountPartitions.length === 0) { // * Todo se va a la particion principal
        const events = eventos.filter(ev => ev.CodigoCte === account.CodigoCte);
        return {
          ...account,
          eventos: events,
          comentarios: commentsForAccount,
          horario: scheduledForAccount
        }

      }
      return accountPartitions.flatMap(partition => {
        const events = eventos.filter(ev => (ev.CodigoCte === account.CodigoCte && ev.Particion === partition.CodigoParticion));
        return {
          ...account,
          Nombre: partition.NombreParticion,
          eventos: events,
          comentarios: commentsForAccount,
          horario: scheduledForAccount
        }
      })
    });
  }
  private responseWOAccount(accounts: string[], eventos: EventSend[], partitions: Partition[], comments: CommentSend[], schedules: HorarioSend[]){
    return accounts.flatMap(account => {
      const accountPartitions = partitions.filter(partition => partition.CodigoCte === account);
      const commentsForAccount = comments.filter(cm => cm.CodigoCliente === account);
      const scheduledForAccount = schedules.find(sh => sh.CodigoCte === account);

      if (accountPartitions.length === 0) { // * Todo se va a la particion principal
        const events = eventos.filter(ev => ev.CodigoCte === account);
        const {Nombre, Direccion, CodigoAbonado} = events[0];
        return {
          Nombre,
          Direccion,
          CodigoAbonado,
          eventos: events.map( ev => {
            const {Nombre, Direccion, CodigoAbonado, ...rest} = ev;
            return rest;
          }),
          comentarios: commentsForAccount,
          horario: scheduledForAccount
        }
      }
      return accountPartitions.reduce((result: any,partition) => {
        const events = eventos.filter(ev => (ev.CodigoCte === account && ev.Particion === partition.CodigoParticion));
        if(events.length > 0){          
          const {Direccion, CodigoAbonado} = events[0];
          result = [...result, {
            Direccion,
            CodigoAbonado,
            Nombre: partition.NombreParticion,
            eventos: events.map( ev => {
              const {Nombre, Direccion, CodigoAbonado, ...rest} = ev;
              return rest;
            }),
            comentarios: commentsForAccount,
            horario: scheduledForAccount
          }]
        }
        return result;
      }, [])
    });
  }
  private responseTopAccount(accounts: AccountResponse[],eventos: EventTopSend[], partitions: Partition[]){
    return accounts.flatMap( account => {
      const accountPartitions = partitions.filter(partition => partition.CodigoCte === account.CodigoCte);
      if(accountPartitions.length === 0){ // * Todo a la particion principal
        const events = eventos.filter( ev => (ev.CodigoAbonado === account.CodigoAbonado && ev.CodigoReceptora === account.CodigoReceptora))
        return {
          ...account,
          eventos: events,
        }
      }
      return accountPartitions.flatMap(partition => {
        const events = eventos.filter(ev => (ev.CodigoAbonado === account.CodigoAbonado && ev.CodigoReceptora === account.CodigoReceptora && ev.Particion === partition.CodigoParticion));
        return {
          ...account,
          Nombre: partition.NombreParticion,
          eventos: events,
        }
      })
    })
  }

  // * Helpers para todos los metodos
  private uniqueAccounts(accounts: string[]) {
    return Array.from(new Set(accounts));
  }
  private formatEvents(events: Event[]): EventSend[] {
    return events.map(event => {
      const { CodigoZona, NombreUsuario, Descripcion, FechaHora, FechaHoraFinalizo, FechaHoraPrimeraToma, ...rest } = event;
      if (event.CodigoAlarma === 'O' || event.CodigoAlarma === 'OS' || event.CodigoAlarma === 'C' || event.CodigoAlarma === 'CS') {
        return {
          ...rest,
          CodigoZona: '',
          DescripcionZona: '',
          CodigoUsuario: CodigoZona,
          NombreUsuario: (CodigoZona === "0") ? 'Sistema/llavero' : NombreUsuario,
          FechaOriginal: FechaHora.substring(0, 10),
          Hora: FechaHora.substring(11, 19),
          FechaPrimeraToma: FechaHoraPrimeraToma ? FechaHoraPrimeraToma.substring(0, 10) : FechaHora.substring(0, 10),
          HoraPrimeraToma: FechaHoraPrimeraToma ? FechaHoraPrimeraToma.substring(11, 19) : FechaHora.substring(11, 19),
          FechaFinalizo: FechaHoraFinalizo ? FechaHoraFinalizo.substring(0, 10) : FechaHora.substring(0, 10),
          HoraFinalizo: FechaHoraFinalizo ? FechaHoraFinalizo.substring(11, 19) : FechaHora.substring(0, 10)
        }
      }
      return {
        ...rest,
        CodigoZona: CodigoZona,
        DescripcionZona: Descripcion,
        CodigoUsuario: '',
        NombreUsuario: '',
        FechaOriginal: FechaHora.substring(0, 10),
        Hora: event.FechaHora.substring(11, 19),
        FechaPrimeraToma: FechaHoraPrimeraToma ? FechaHoraPrimeraToma.substring(0, 10) : FechaHora.substring(0, 10),
        HoraPrimeraToma: FechaHoraPrimeraToma ? FechaHoraPrimeraToma.substring(11, 19) : FechaHora.substring(11, 19),
        FechaFinalizo: FechaHoraFinalizo ? FechaHoraFinalizo.substring(0, 10) : FechaHora.substring(0, 10),
        HoraFinalizo: FechaHoraFinalizo ? FechaHoraFinalizo.substring(11, 19) : FechaHora.substring(0, 10)
      }
    })
  }
  private formatTopEvents(events: EventTop[]): EventTopSend[]{
    return events.map(event => {
      const { CodigoZona, NombreUsuario, Descripcion, FechaHora, ...rest } = event;
      if (event.CodigoAlarma === 'O' || event.CodigoAlarma === 'OS' || event.CodigoAlarma === 'C' || event.CodigoAlarma === 'CS') {
        return {
          ...rest,
          CodigoZona: '',
          DescripcionZona: '',
          CodigoUsuario: CodigoZona,
          NombreUsuario: (CodigoZona === "0") ? 'Sistema/llavero' : NombreUsuario,
          FechaOriginal: FechaHora.substring(0, 10),
          Hora: FechaHora.substring(11, 19),
        }
      }
      return {
        ...rest,
        CodigoZona: CodigoZona,
        DescripcionZona: Descripcion,
        CodigoUsuario: '',
        NombreUsuario: '',
        FechaOriginal: FechaHora.substring(0, 10),
        Hora: event.FechaHora.substring(11, 19)
      }
    })
  }
  private getRangeTableEvent(dateStart: string, dateEnd: string) {
    const [yearStart, ...rest] = dateStart.split('-');
    const [yearEnd, ...rest2] = dateEnd.split('-');
    let years: Array<string> = [];
    for (let i = Number(yearEnd); i >= Number(yearStart); i--) {
      years = [...years, `Evento${i}`]
    }
    return years;
  }

}
