import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { CustomizationService } from './customization.service';
import { UpdateCustomizationDto } from './customization.dto';
@Controller('store/customization')
@UseGuards(JwtAuthGuard)
export class CustomizationController {
  constructor(private readonly service: CustomizationService) {}
  @Get() get(@StoreId() storeId: string) {
    return this.service.get(storeId);
  }
  @Put() update(
    @StoreId() storeId: string,
    @Req() req: any,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: UpdateCustomizationDto,
  ) {
    if (req.user.profile !== 'storeOwner')
      throw new ForbiddenException('Only the store owner can change branding');
    return this.service.update(storeId, input);
  }
}
