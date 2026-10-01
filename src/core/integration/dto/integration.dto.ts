import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class IntegrationWpp {
  @ApiProperty({
    description: 'ID of store',
    example: 1,
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;
}

export class IntegrationOlx {
  @ApiProperty({
    description: 'ID of store',
    example: 1,
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    description: 'Client ID',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Client Secret',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}

export class IntegrationInstagram {
  @ApiProperty({
    description: 'ID of store',
    example: 1,
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;
}

export class IntegrationFacebook {
  @ApiProperty({
    description: 'ID of store',
    example: 1,
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;
}
