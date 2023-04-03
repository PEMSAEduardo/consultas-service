import { CacheInterceptor, Controller, UseInterceptors } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AccountsService } from './accounts.service';
import { AccountRequest, AccountsRequest, SearchAccountsRequest } from './interfaces';


@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @GrpcMethod('DbService')
  async findOneAccount( data: AccountRequest){   
    if(!data.account){
      throw new RpcException('Debe de proporcionar una cuenta a buscar');
    }
    return await this.accountsService.getAccount(data);
  }

  @UseInterceptors(CacheInterceptor)
  @GrpcMethod('DbService')
  async allAccounts(data: AccountsRequest){
    
    const response = await this.accountsService.getAllAccounts(data);
    return {
      accounts: response
    };
  }

  @GrpcMethod('DbService')
  async searchAccounts(data: SearchAccountsRequest){
    
    if(!data.accounts){
      throw new RpcException('Debe de proporcionar al menos una cuenta a buscar');
    }
    const response = await this.accountsService.searchAccounts(data);
    return {
      accounts: response
    };
    
  }
  
}
