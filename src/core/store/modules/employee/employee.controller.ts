import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import {
  CreateEmployeeDto,
  EditEmployeeDto,
  EditStatusEmployeeDto,
} from './dto/employee.dto';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import {
  findEmployeeDoc,
  findAllEmployeesDoc,
  createEmployeeDoc,
  editEmployeeDoc,
  editEmployeesDoc,
} from './docs/employee.swagger';
import { ListEmployeesDto } from './dto/list-employees.dto';

@ApiTags('Employee')
@UseGuards(JwtAuthGuard, ProfileGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @createEmployeeDoc()
  @Profile(USER_PROFILE.STOREOWNER)
  @ApiBody({ type: CreateEmployeeDto })
  @Post('/create-employee')
  async createEmployee(
    @StoreId() storeId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return await this.employeeService.createEmployee(storeId, dto);
  }

  @editEmployeeDoc()
  @Profile(USER_PROFILE.STOREOWNER)
  @ApiBody({ type: EditEmployeeDto })
  @Put('/edit-employee/:employeeId')
  async updateEmployee(
    @Param('employeeId') employeeId: string,
    @StoreId() storeId: string,
    @Body() dto: EditEmployeeDto,
  ) {
    return await this.employeeService.updateEmployee(employeeId, storeId, dto);
  }

  @findAllEmployeesDoc()
  @Profile(USER_PROFILE.STOREOWNER, USER_PROFILE.USER)
  @Get('/search-employees')
  async getAllEmployees(
    @StoreId() storeId: string,
    @Query() params: ListEmployeesDto,
  ) {
    return await this.employeeService.getAllEmployees(storeId, params);
  }

  @findEmployeeDoc()
  @Profile(USER_PROFILE.STOREOWNER, USER_PROFILE.USER)
  @Get('/search-employee/:employeeId')
  async getEmployee(
    @Param('employeeId') employeeId: string,
    @StoreId() storeId: string,
  ) {
    return await this.employeeService.getEmployee(employeeId, storeId);
  }

  @editEmployeesDoc()
  @Profile(USER_PROFILE.STOREOWNER)
  @Put('update-status/:employeeId')
  async updateEmployeeStatus(
    @Param('employeeId') employeeId: string,
    @StoreId() storeId: string,
    @Body() dto: EditStatusEmployeeDto,
  ) {
    return await this.employeeService.updateEmployeeStatus(
      employeeId,
      storeId,
      dto,
    );
  }
}
