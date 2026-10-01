import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateCustomerDto,
  EditCustomerDto,
  ListCustomerDto,
} from './dto/customer.dto';
import {
  AttachmentCustomerDoc,
  EnableCustomerDoc,
  CreateCustomerDoc,
  EditCustomerDoc,
  DeactivateCustomerDoc,
  ListCustomerDoc,
  GetCustomerDoc,
} from './docs/customer.swagger';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Customer')
@UseGuards(JwtAuthGuard, ProfileGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @CreateCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post('/create')
  async createCustomer(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() createCustomer: CreateCustomerDto,
  ) {
    return this.customerService.createCustomerInStore(
      storeId,
      userId,
      createCustomer,
    );
  }

  @GetCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get('/get/:customerId')
  async findCustomer(
    @StoreId() storeId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customerService.findCustomerById(storeId, customerId);
  }

  @ListCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get('/list')
  async findCustomers(
    @StoreId() storeId: string,
    @Query() params: ListCustomerDto,
  ) {
    return this.customerService.findCustomersByStore(storeId, params);
  }

  @EditCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Put('/edit/:customerId')
  async editCustomer(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('customerId') customerId: string,
    @Body() editCustomer: EditCustomerDto,
  ) {
    return this.customerService.editCustomerInStore(
      storeId,
      userId,
      customerId,
      editCustomer,
    );
  }

  @DeactivateCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Put('/deactivate/:customerId')
  async deactivateCustomer(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customerService.deactivateCustomerInStore(
      storeId,
      userId,
      customerId,
    );
  }

  @UseInterceptors(AnyFilesInterceptor())
  @AttachmentCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post('/attachment/:customerId')
  async sendAttachmentCustomer(
    @StoreId() storeId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Param('customerId') customerId: string,
  ) {
    return this.customerService.sendAttachment(storeId, customerId, files);
  }

  @EnableCustomerDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Put('/enable/:customerId')
  async enableCustomer(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customerService.enableCustomerInStore(
      storeId,
      userId,
      customerId,
    );
  }

  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB
      },
    }),
  )
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post('/import')
  async importCustomers(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Param('app') app: 'autoConf' | 'resellerMore',
  ) {
    return this.customerService.importCustomers(storeId, userId, files[0], app);
  }
}
