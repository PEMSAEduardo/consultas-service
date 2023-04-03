import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Char, ConnectionPool, Int, IResult, PreparedStatement, TinyInt } from 'mssql'
import { deleteSpace, spacesForElement, spacesObject } from '../helpers/spaces';
import { Account, Comment, CommentSend, Contact, Event, EventSimple, EventTop, FilterRequest, Group, Horario, HorarioSend, Partition, User, Zone } from '../interfaces';

export interface AccountQuery {
    CodigoAbonado: string;
    CodigoReceptora: number;
    Particion: number;
}

// TODO Cargar con variables de entorno
@Injectable({ scope: Scope.TRANSIENT })
export class DbService implements OnModuleInit {

    private readonly pool: ConnectionPool;

    constructor() {
        this.pool = new ConnectionPool({
            user: 'sa',
            password: '',
            server: '', // You can use 'localhost\\instance' to connect to named instance
            database: "",
            options: {
                trustServerCertificate: true // change to true for local dev / self-signed certs
            },
            pool: {
                max: 500,
                min: 0,
                idleTimeoutMillis: 30000
            },
            requestTimeout: 1500000,
            port: 1433
        })
    }

    // * Para consulta de cuentas y datos de las mismas
    private queryConstructorAccounts(accounts: string[], state: number, detail: boolean, panel: boolean, security: boolean) {
        let query = `
        SELECT distinct C.CodigoCte, COALESCE(C.CodigoAbonado,'SN') as CodigoAbonado,C.Nombre, C.Direccion, COALESCE(C.CodigoReceptora, -1) as CodigoReceptora, C.Estado as Status ${detail ? ", COALESCE(C.Ubicacion, 'No registrado') as Ubicacion, COALESCE(C.MunicipioCte, 'No registrado') as Municipio, EDP.NombreEdo as Estado" : ''} ${panel ? ", P.DescripcionPanel as Panel, Cs.AccesoPorLinea, Cs.AccesoPorIP, Cs.AccesoPorGPRS, Cs.Otro as SinEnlace, COALESCE(Cs.CoordGPS, 'SN') as CoordGPS" : ''} ${security ? ', CS.PalabraDeSeg, CS.PalabraDeSegTA, CS.Amago ' : ''} FROM Cliente AS C ${detail ? 'LEFT JOIN EdoRep as EDP ON EDP.CodigoEdoRep = C.EdoRepCte' : ''} ${(panel || security) ? 'LEFT JOIN ClienteSeguridad AS CS ON Cs.CodigoCte=C.CodigoCte' : ''} ${panel ? ' LEFT JOIN Panel AS P ON P.CodigoPanel=CS.CodigoPanel' : ''} `;
        if (state > 0) {
            query += `WHERE C.Estado = ${(state === 1) ? "'A'" : "'I'"} ${(accounts.length === 0) ? '' : ' AND'}`;
        }
        if (accounts.length === 0) {
            return query;
        }
        return query += `${(state > 0) ? '' : 'WHERE'} C.CodigoCte in (${accounts})`;
    }
    async getAccounts(accounts: string[], state: number, detail: boolean, panel: boolean, security: boolean, clean: boolean = true) {
        try {
            const accountsSP = spacesForElement(accounts);
            const query = this.queryConstructorAccounts(accountsSP, state, detail, panel, security);

            const { recordset }: IResult<Account> = await this.pool.request()
                .query(query)
            if (clean) return deleteSpace(recordset)
            return recordset;

        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LAS CUENTAS - ERROR ${error}`)

        }
    }

    async getPartitions(accounts: string[], clean: boolean = true) {
        try {

            const accountsSP = spacesForElement(accounts);
            const { recordset }: IResult<Partition> = await this.pool.request()
                .query(`SELECT CodigoParticion, NombreParticion, CodigoCte FROM Particion where EsParticionHdr = 0 ${(accountsSP.length === 0) ? '' : `AND CodigoCte in (${accountsSP})`}`)
            if (clean) return deleteSpace(recordset)

            return recordset;

        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LAS PARTICIONES - ERROR ${error}`)
        }
    }

    async getZones(accounts: Array<string>, device: boolean, clean: boolean = true) {
        try {
            const accountsSP = spacesForElement(accounts);
            const query = `
                SELECT distinct Z.CodigoCte, Z.CodigoZona, COALESCE(Z.Descripcion, 'Sin descripción') as Descripcion, COALESCE(Z.Observacion, 'Sin observacion') as Observacion
                ${device ? " , COALESCE(DP1.NombreDispositivo, 'Sin Dispositivo') as Dispositivo1, COALESCE(Z.Cantidad1, 0) as Cantidad1, COALESCE(DP2.NombreDispositivo, 'Sin Dispositivo') as Dispositivo2, COALESCE(Z.Cantidad2, 0) as Cantidad2, COALESCE(DP3.NombreDispositivo, 'Sin Dispositivo') as Dispositivo3, COALESCE(Z.Cantidad3, 0) as Cantidad3" : ''} 
                FROM  Zonas Z LEFT JOIN Cliente C ON Z.CodigoCte = C.CodigoCte ${device ? 'LEFT JOIN Dispositivos DP1 ON DP1.CodDispositivo = Z.Dispositivo1 LEFT JOIN Dispositivos DP2 ON DP2.CodDispositivo = Z.Dispositivo2 LEFT JOIN Dispositivos DP3 ON DP3.CodDispositivo = Z.Dispositivo3' : ''} 
                ${(accountsSP.length === 0) ? '' : `WHERE C.CodigoCte in (${accountsSP})`}
            `;

            const { recordset }: IResult<Zone> = await this.pool.request()
                .query(query);

            if (clean) return deleteSpace(recordset)

            return recordset;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LA TABLA ZONAS - ERROR ${error}`)
        }
    }

    async getUsers(accounts: Array<string>, clean: boolean = true) {
        try {
            const accountsSP = spacesForElement(accounts);
            const { recordset }: IResult<User> = await this.pool.request()
                .query(`SELECT distinct C.CodigoCte, U.CodigoUsuario, COALESCE(NombreUsuario, '') as NombreUsuario, COALESCE(Clave, '') as Clave, COALESCE(ObservacionUsuario, '') as ObservacionUsuario FROM T_Usuarios U LEFT JOIN Cliente C ON U.CodigoCte = C.CodigoCte ${(accountsSP.length === 0) ? '' : `WHERE C.CodigoCte in (${accountsSP})`}`);

            if (clean) return deleteSpace(recordset);
            return recordset;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LA TABLA USUARIOS - ERROR ${error}`);
        }
    }

    async getContacts(accounts: Array<string>, clean: boolean = true) {
        try {
            const accountsSP = spacesForElement(accounts);
            const { recordset }: IResult<Contact> = await this.pool.request()
                .query(`SELECT distinct C.CodigoCte, CC.Orden, CC.Telefono, CC.Contacto, COALESCE(CC.PalabraDeSeg, '') as PalabraDeSeg, COALESCE(CC.Observaciones, '') as Observaciones, COALESCE(CC.CodigoAutoridad, -1) as CodigoAutoridad FROM Cliente C LEFT JOIN ClienteContacto CC ON CC.CodigoCte = C.CodigoCte ${(accountsSP.length === 0) ? '' : `WHERE C.CodigoCte in (${accountsSP})`}`);
            if (clean) return deleteSpace(recordset);
            return recordset;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LA TABLA CONTACTOS - ERROR ${error}`);
        }
    }

    async getComments(accounts: Array<string>, startDate: string, endDate: string, startQuery: string, endQuery: string): Promise<CommentSend[]> {
        try {
            const accountsSP = spacesForElement(accounts);
            const { recordset }: IResult<Comment> = await this.pool.request()
                .query(`SELECT  CodigoCliente, Convert (varchar(24), FechaHoraEvento,121) as FechaHoraEvento, Convert (varchar(24), FechaHoraLlamada,121) as  FechaHoraLlamada, COALESCE(TelefonoAl, '') as TelefonoAl, COALESCE(Contacto,'') as Contacto, COALESCE(Comentario,'') as Comentario FROM EventoLLamada where ${(accountsSP.length === 0) ? '' : `CodigoCliente in (${accountsSP}) and `}  FechaHoraEvento between '${startDate} ${startQuery}:00' and '${endDate} ${endQuery}:59' order by FechaHoraLlamada asc`)

            const totalComments = deleteSpace(recordset);
            return totalComments.map(comment => {
                return {
                    CodigoCliente: comment.CodigoCliente,
                    FechaEvento: (comment.FechaHoraEvento) ? comment.FechaHoraEvento.substring(0, 10) : '----------',
                    HoraEvento: (comment.FechaHoraEvento) ? comment.FechaHoraEvento.substring(11, 19) : '--:--:--',
                    FechaLlamada: (comment.FechaHoraLlamada) ? comment.FechaHoraLlamada.substring(0, 10) : '----------',
                    HoraLlamada: (comment.FechaHoraLlamada) ? comment.FechaHoraLlamada.substring(11, 19) : '--:--:--',
                    TelefonoAl: comment.TelefonoAl,
                    Contacto: comment.Contacto,
                    Comentario: comment.Comentario
                }
            })
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LOS COMENTARIOS - ERROR ${error}`);
        }
    }

    async getScheduled(accounts: Array<string>): Promise<HorarioSend[]> {
        try {
            const accountsSP = spacesForElement(accounts);
            const { recordset }: IResult<Horario> = await this.pool.request()
                .query(`SELECT CodigoCte, Horario1P1 as HorarioApertura, Horario1P2 as HorarioCierre, DesActToleranciaH1 as Torerancia, SeUsaHorarios
                FROM ClienteHorario ${(accountsSP.length === 0) ? '' : `where CodigoCte in (${accountsSP})`}`)

            const totalScheduled = deleteSpace(recordset);
            return totalScheduled.map(sh => {
                const horasAp = sh.HorarioApertura.match(/.{1,4}/g)!.map(hora => {
                    return hora.match(/.{1,2}/g)!.join(':')
                });
                const horasCi = sh.HorarioCierre.match(/.{1,4}/g)!.map(hora => {
                    return hora.match(/.{1,2}/g)!.join(':')
                });

                return {
                    CodigoCte: sh.CodigoCte.trim(),
                    VerificaApertura: (sh.SeUsaHorarios[0] === '1') ? true : false,
                    VerificaCierre: (sh.SeUsaHorarios[1] === '1') ? true : false,
                    HorariosApertura: horasAp,
                    HorariosCierre: horasCi,
                    CheckAntesApertura: (sh.Torerancia.substring(11, 12) === '1') ? true : false,
                    CheckdespuesApertura: (sh.Torerancia.substring(15, 16) === '1') ? true : false,
                    CheckAntesCierre: (sh.Torerancia.substring(27, 28) === '1') ? true : false,
                    CheckDespuesCierre: (sh.Torerancia.substring(31, 32) === '1') ? true : false,
                    ToleranciaAperturaAntes: sh.Torerancia.substring(2, 4),
                    ToleranciaAperturaDespues: sh.Torerancia.substring(6, 8),
                    ToleranciaCierreAntes: sh.Torerancia.substring(18, 20),
                    ToleranciaCierreDespues: sh.Torerancia.substring(22, 24)
                }
            })
        } catch (error) {
            throw new RpcException(`Error al consultar la tabla ClienteHorario - Error: ${error}`);
        }
    }

    // * Para consulta de grupos 
    // ? Se obtienen tambien las cuentas para poder verificar sus datos
    async getGroups(groups: number[], showAccounts: boolean, clean: boolean = true) {
        try {
            const { recordset }: IResult<Group> = await this.pool.request()
                .query(`SELECT GCH.CodigoGrupoCte as Codigo, COALESCE(DescripcionGrupo, 'Sin Nombre') as Nombre ${showAccounts ? ', GCD.CodigoCte' : ''} from GrupoClienteHdr as GCH ${showAccounts ? 'LEFT JOIN GrupoClienteDet GCD ON GCH.CodigoGrupoCte = GCD.CodigoGrupoCte' : ''} ${(groups.length === 0) ? '' : `where GCH.CodigoGrupoCte IN (${groups})`}`)

            if (clean) return deleteSpace(recordset);

            return recordset;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LOS GRUPOS - ERROR ${error}`)
        }
    }

    async getDealers(dealers: number[], showAccounts: boolean, clean: boolean = true) {
        try {
            const { recordset }: IResult<Group> = await this.pool.request()
                .query(`SELECT DL.CodigoDealer as Codigo, COALESCE(DescripcionDealer, 'Sin Nombre') as Nombre ${showAccounts ? ', CL.CodigoCte' : ''}  from Dealer as DL ${showAccounts ? 'LEFT JOIN Cliente CL ON DL.CodigoDealer = CL.CodigoDealer ' : ''} ${(dealers.length === 0) ? '' : `WHERE DL.CodigoDealer IN (${dealers})`}`)
            if (clean) return deleteSpace(recordset);
            return recordset;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LOS DEALERS - ERROR ${error}`)
        }
    }

    private queryFilter(filters: Array<FilterRequest>, exclude: boolean) {
        if (filters.length === 0) {
            return " Ev.CodigoAlarma <> 'ri'"
        }

        const alarms = filters.filter(fl => fl.type === 1).map(fl => fl.code);
        const events = filters.filter(fl => fl.type === 2).map(fl => fl.code);

        if (alarms.length > 0 && events.length > 0) {
            return ` (Ev.CodigoAlarma ${exclude ? 'NOT IN' : 'IN'} (${spacesForElement(alarms, 0)}) or Ev.CodigoEvento ${exclude ? 'NOT IN' : 'IN'} (${spacesForElement(events, 0)}) )`;
        } else if (alarms.length > 0) {
            return ` (Ev.CodigoAlarma ${exclude ? 'NOT IN' : 'IN'} (${spacesForElement(alarms, 0)}))`;
        } else {
            return ` (Ev.CodigoEvento ${exclude ? 'NOT IN' : 'IN'} (${spacesForElement(events, 0)}))`;
        }
    }
    private queryDate(startDate: string, endDate: string, startQuery: string = '00:00', endQuery: string = '23:59') {
        return ` and EV.FechaHora between '${startDate} ${startQuery}:00' and '${endDate} ${endQuery}:59' `;
    }
    
    async getEvents(accounts: Array<string>, table: string, state: number, filters: Array<FilterRequest>, exclude: boolean, startDate: string, endDate: string, startQuery: string, endQuery: string, order: number,clean: boolean = true) {
        try {
            const accountsSP = spacesForElement(accounts);
            
            // TODO Verificar el uso del campo CodigoReceptora
            const queryFilter = this.queryFilter(filters, exclude) + this.queryDate(startDate, endDate, startQuery, endQuery);
            let query = `SELECT CL.CodigoCte, COALESCE(CL.CodigoReceptora, -1) as CodigoReceptora, Convert (varchar(24), EV.FechaHora,121) as FechaHora, EV.CodigoEvento, EV.CodigoZona,  Ev.Particion, AL.DescripcionAlarm, AL.CodigoAlarma, Ev.NombreUsuario, EVC.DescripcionEvent, EV.NombreZona as Descripcion, EV.ClaveMonitorista, CFE.NomCalifEvento,  Convert (varchar(24), EV.FechaHoraPrimeraToma,121) as FechaHoraPrimeraToma, Convert (varchar(24), EV.FechaHoraFinalizo,121) as FechaHoraFinalizo FROM ${table} EV LEFT JOIN Cliente CL ON ( EV.CodigoAbonado = CL.CodigoAbonado and EV.CodigoReceptora = CL.CodigoReceptora) LEFT JOIN Alarma AL ON (EV.CodigoAlarma = AL.CodigoAlarma) LEFT JOIN EventosCat EVC ON (EV.CodigoEvento = EVC.CodigoEvento ) LEFT JOIN CalificaEvento CFE ON (EV.CalificacionEvento = CFE.CodCalifEvento) WHERE ${queryFilter} `;
            if (state > 0) {
                query += ` and CL.Estado = ${(state === 1) ? "'A'" : "'I'"} ${(accountsSP.length === 0) ? '' : ' AND'}`;
            }
            if (accountsSP.length > 0) {
                query += `${(state > 0) ? '' : 'AND'} CL.CodigoCte in (${accountsSP})`;
            }
            
            const { recordset }: IResult<Event> = await this.pool.request()
                .query(query + ` ORDER BY EV.FechaHora ${(order === 1) ? 'ASC' : 'DESC'}`)
            
            if (clean) return deleteSpace(recordset);
            return recordset;
        } catch (error) {
            console.log(error);
            
            throw new RpcException(`ERROR AL CONSULTAR LOS EVENTOS EN LA TABLA ${table} - ERROR ${error}`);
        }
    }

    async getEventsWOAccount(table: string, state: number, filters: Array<FilterRequest>, exclude: boolean, startDate: string, endDate: string, startQuery: string, endQuery: string, order: number, clean: boolean = true) {
        try {
            const queryFilter = this.queryFilter(filters, exclude) + this.queryDate(startDate, endDate, startQuery, endQuery);
            let query = `SELECT CL.CodigoCte, COALESCE(CL.CodigoAbonado,'SN') as CodigoAbonado,CL.Nombre, CL.Direccion, COALESCE(CL.CodigoReceptora, -1) as CodigoReceptora, Convert (varchar(24), EV.FechaHora,121) as FechaHora, EV.CodigoEvento, EV.CodigoZona,  Ev.Particion, AL.DescripcionAlarm, AL.CodigoAlarma, Ev.NombreUsuario, EVC.DescripcionEvent, EV.NombreZona as Descripcion, EV.ClaveMonitorista, CFE.NomCalifEvento,  Convert (varchar(24), EV.FechaHoraPrimeraToma,121) as FechaHoraPrimeraToma, Convert (varchar(24), EV.FechaHoraFinalizo,121) as FechaHoraFinalizo FROM ${table} EV LEFT JOIN Cliente CL ON ( EV.CodigoAbonado = CL.CodigoAbonado and EV.CodigoReceptora = CL.CodigoReceptora) LEFT JOIN Alarma AL ON (EV.CodigoAlarma = AL.CodigoAlarma) LEFT JOIN EventosCat EVC ON (EV.CodigoEvento = EVC.CodigoEvento ) LEFT JOIN CalificaEvento CFE ON (EV.CalificacionEvento = CFE.CodCalifEvento) WHERE ${queryFilter} `;
            if (state > 0) {
                query += ` and C.Estado = ${(state === 1) ? "'A'" : "'I'"}}`;
            }

            const { recordset }: IResult<EventSimple> = await this.pool.request()
                .query(query + `ORDER BY EV.FechaHora ${(order === 1) ? 'ASC' : 'DESC'}`)

            if (clean) return deleteSpace(recordset);
            return recordset;

        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LOS EVENTOS EN LA TABLA ${table} - ERROR ${error}`);
        }
    }

    private async topEvents(accounts: Array<AccountQuery>, table: string, queryFilter: string, top: number) {

        const ps = new PreparedStatement(this.pool);
        ps.input('CodigoAbonado', Char(6))
        ps.input('CodigoReceptora', TinyInt)
        ps.input('Particion', Int)

        try {
            await ps.prepare(`IF @Particion = -1 
            BEGIN
            SELECT Top(${top}) EV.CodigoAbonado, EV.CodigoReceptora, Convert (varchar(24), EV.FechaHora,121) as FechaHora, EV.CodigoEvento, EV.CodigoZona, EV.Particion, AL.DescripcionAlarm, AL.CodigoAlarma, Ev.NombreUsuario, EVC.DescripcionEvent, EV.NombreZona as Descripcion FROM ${table} EV LEFT JOIN Alarma AL ON (EV.CodigoAlarma = AL.CodigoAlarma) LEFT JOIN EventosCat EVC ON (EV.CodigoEvento = EVC.CodigoEvento ) where EV.CodigoAbonado = @CodigoAbonado and EV.CodigoReceptora = @CodigoReceptora and ${queryFilter} order by FechaHora DESC
            END
            ELSE
            BEGIN
            SELECT Top(${top}) EV.CodigoAbonado, EV.CodigoReceptora, Convert (varchar(24), EV.FechaHora,121) as FechaHora, EV.CodigoEvento, EV.CodigoZona,  Ev.Particion, AL.DescripcionAlarm, AL.CodigoAlarma, Ev.NombreUsuario, EVC.DescripcionEvent, EV.NombreZona as Descripcion FROM ${table} EV LEFT JOIN Alarma AL ON (EV.CodigoAlarma = AL.CodigoAlarma) LEFT JOIN EventosCat EVC ON (EV.CodigoEvento = EVC.CodigoEvento ) where EV.CodigoAbonado = @CodigoAbonado and EV.CodigoReceptora = @CodigoReceptora and EV.Particion = @Particion and ${queryFilter}  order by FechaHora DESC
            END
            `)
            let eventsAccounts: Array<EventTop> = [];
            // try {
            for (let index = 0; index < accounts.length; index++) {

                const data = await ps.execute({ CodigoAbonado: accounts[index].CodigoAbonado, Particion: accounts[index].Particion, CodigoReceptora: accounts[index].CodigoReceptora });
                eventsAccounts = [...eventsAccounts, ...data.recordset]

            }
            // } finally {
            return deleteSpace(eventsAccounts);
            // }
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LOS EVENTOS EN LA TABLA ${table}- ERROR ${error}`);
        } finally {
            await ps.unprepare();
        }
    }

    private async getTablesEvents() {
        try {
            const { recordset }: IResult<{ TABLE_NAME: string }> = await this.pool.request()
                .query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'Evento[1-9]___' ORDER BY TABLE_NAME DESC")
            let table: Array<string> = [];
            for (let i = 0; i < recordset.length; i++) {
                table = [...table, recordset[i].TABLE_NAME];
            }
            return table;
        } catch (error) {
            throw new RpcException(`ERROR AL CONSULTAR LAS TABLAS DE EVENTO - ERROR ${error}`);
        }
    }
    async getTopEvents(accounts: AccountQuery[], filters: Array<FilterRequest>, exclude: boolean, top: number) {

        const tablesQuery = await this.getTablesEvents();
        const queryFilter = this.queryFilter(filters, exclude);

        let limit = 10;
        if (accounts.length > 200) {
            limit = 100;
        }
        let accountsSpace = spacesObject(accounts, [{ key: 'CodigoAbonado', spaces: 6 }]);
        let eventsAccounts: Array<EventTop> = [];
        let accountsSearch = accounts;
        let partsAccounts: Array<Array<{
            Particion: number;
            CodigoAbonado: string;
            CodigoReceptora: number;
        }>> = [];
        for await (const table of tablesQuery) {
            
            for (let idx = 0; idx < accountsSpace.length; idx += limit) {
                partsAccounts = [...partsAccounts, accountsSpace.slice(idx, idx + limit)]
            }

            const resp = await Promise.all(partsAccounts.map(acc => this.topEvents(acc, table, queryFilter, top)));
            let response = resp.flatMap(event => event);

            eventsAccounts = [...eventsAccounts, ...response]

            accountsSearch = accountsSearch.filter(acc => {
                if (acc.Particion === -1) {
                    return (response.findIndex(eventresp => eventresp.CodigoAbonado === acc.CodigoAbonado && eventresp.CodigoReceptora === acc.CodigoReceptora) === -1) ? true : false
                }
                return (response.findIndex(eventresp => eventresp.CodigoAbonado === acc.CodigoAbonado && eventresp.CodigoReceptora === acc.CodigoReceptora && acc.Particion === eventresp.Particion) === -1) ? true : false
            });

            if (accountsSearch.length === 0) {
                break;
            }
            accountsSpace = spacesObject(accountsSearch, [{ key: 'CodigoAbonado', spaces: 6 }])
            partsAccounts = [];
        }
        return eventsAccounts;
    }

    async existTable(table: string) {
        try {
            const { rowsAffected } = await this.pool.request()
                .query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${table}'`)

            if (rowsAffected[0] === 0) {
                throw `LA TABLA ${table} NO EXISTE EN EL SERVIDOR`;
            }
        } catch (error) {
            throw new RpcException(`ERROR AL VERIFICAR LA EXISTENCIA DE LA TABLA ${table} - ERROR ${error}`)
        }
    }


    onModuleInit() {
        this.pool.connect()
            .then(() => {
                console.log('Conected');
            })
            .catch((error) => {
                console.log('No');
                console.log(error);
            })
    }
}
