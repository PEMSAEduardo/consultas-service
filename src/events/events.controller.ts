import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { EventsService } from './events.service';
import { EventsGroupsRequest, EventsRequest, EventsWOAccountRequest, EventsTopGroupRequest, EventsTopRequest } from './interfaces';


@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @GrpcMethod('DbService')
  async getEventsFromGroup(data: EventsGroupsRequest){
    if(!data.typeAccount){
      throw new RpcException('Debe de proporcionar el tipo de cuenta a consultar');
    }
    if(data.accounts.length === 0){
      throw new RpcException('Debe de proporcionar al menos un grupo');
    }
    if(!data.dateStart){
      throw new RpcException('Debe de proporcionar una fecha inicial de consulta');
    }
    if(!data.dateEnd){
      throw new RpcException('Debe de proporcionar una fecha final de consulta');
    }
    
    const resp = await this.eventsService.getEventsFromGroup(data);
    return {
      data: resp
    };
  }

  @GrpcMethod('DbService')
  async getEvents(data: EventsRequest){
    if(!data.dateStart){
      throw new RpcException('Debe de proporcionar una fecha inicial de consulta');
    }
    if(!data.dateEnd){
      throw new RpcException('Debe de proporcionar una fecha final de consulta');
    }
    
    const resp = await this.eventsService.getEvents(data);
    
    return {
      data: resp
    };
  }

  @GrpcMethod('DbService')
  async getEventsWithOutAccounts(data: EventsWOAccountRequest){
    if(!data.dateStart){
      throw new RpcException('Debe de proporcionar una fecha inicial de consulta');
    }
    if(!data.dateEnd){
      throw new RpcException('Debe de proporcionar una fecha final de consulta');
    }
    const resp = await this.eventsService.getEventsWOAccount(data);    
    return {
      data: resp
    };
  }

  @GrpcMethod('DbService')
  async getTopEventsFromGroup(data: EventsTopGroupRequest){
    if(data.accounts.length === 0){
      throw new RpcException('Debe de proporcionar al menos un grupo');
    }
    
    const resp = await this.eventsService.getTopEventsGroups(data);
    
    return {
      data: resp
    };
  }

  @GrpcMethod('DbService')
  async getTopEvents(data: EventsTopRequest){
    
    const resp = await this.eventsService.getTopEvents(data);
    
    return {
      data: resp
    };
  }
}
