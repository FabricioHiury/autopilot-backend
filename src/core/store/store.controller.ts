import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import {
  RegisterContactStoreDoc,
  RegisterAddressStoreDoc,
  RegistrationStoreDoc,
  DeleteAddressStoreDoc,
  EditStoreDoc,
  ListStoresDoc,
  GetStoreDoc,
} from './docs/store.swagger';
import {
  RegistrationAddressDto,
  RegistrationStoreOwnerDto,
  EditContactDto,
  EditStoreDto,
  ListStoreDto,
} from './dto/store.dto';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from '../user/enum/profile.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { PERMISSIONS_STORE } from '../user/enum/permissions_features.enum';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @GetStoreDoc()
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @Profile(USER_PROFILE.STOREOWNER, USER_PROFILE.AUTOPILOT)
  async getStoreOwnerById(@StoreId() id: string) {
    return await this.storeService.getStoreById(id);
  }

  @RegistrationStoreDoc()
  @Post('/register')
  @HttpCode(201)
  async createStoreOwner(
    @Body() registrationStoreOwnerDto: RegistrationStoreOwnerDto,
  ) {
    return await this.storeService.registerStoreOwner(
      registrationStoreOwnerDto,
    );
  }

  @Post('confirm-email')
  @HttpCode(201)
  async confirmEmail(@Body() params: { token: string }) {
    return await this.storeService.confirmEmail(params.token);
  }

  @RegisterAddressStoreDoc()
  @Put('/address')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DATA_OF_STORE])
  async editAddress(
    @StoreId() storeId: string,
    @Body() params: RegistrationAddressDto,
  ) {
    return await this.storeService.registerAddress(params, storeId);
  }

  @DeleteAddressStoreDoc()
  @Delete('/address/:idAddress')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @HttpCode(200)
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DATA_OF_STORE])
  async deleteAddress(
    @StoreId() storeId: string,
    @Param('idAddress') idAddress: string,
  ) {
    return await this.storeService.deleteAddress(storeId, idAddress);
  }

  @RegisterContactStoreDoc()
  @Put('/contact')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DATA_OF_STORE])
  async registerContact(
    @StoreId() storeId: string,
    @Body() params: EditContactDto,
  ) {
    return await this.storeService.registerContact(storeId, params);
  }

  @ListStoresDoc()
  @Get('/list')
  @UseGuards(JwtAuthGuard)
  async listStoreOwners(@Query() list: ListStoreDto) {
    return await this.storeService.listStoreOwner(list);
  }

  @EditStoreDoc()
  @Put('/edit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DATA_OF_STORE])
  async editStoreOwner(
    @Body() editStoreOwnerDto: EditStoreDto,
    @StoreId() storeId: string,
  ) {
    return await this.storeService.editStore(editStoreOwnerDto, storeId);
  }

  @Get('/meu-access')
  @UseGuards(JwtAuthGuard)
  async myAccess(@UserId() userId: string, @StoreId() storeId: string) {
    return await this.storeService.getAccessByIdUser(userId, storeId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/update-logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DATA_OF_STORE])
  async updateLogo(
    @StoreId() storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.storeService.updateLogo(storeId, file);
  }
}
