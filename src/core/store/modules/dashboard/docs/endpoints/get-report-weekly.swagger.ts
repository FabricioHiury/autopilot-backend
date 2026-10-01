import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class SuccessDeal {
  @ApiProperty({ example: 2 })
  limit: number;

  @ApiProperty({
    example: 100,
    description: 'Difference percentage at relation to week previous.',
  })
  percentage: number;
}

class NewDeals {
  @ApiProperty({ example: 3 })
  limit: number;

  @ApiProperty({
    example: 50,
    description: 'Difference percentage at relation to week previous.',
  })
  percentage: number;

  @ApiProperty()
  success: SuccessDeal;
}

class SalespersonHighlight {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 1 })
  idPhoto: string;

  @ApiProperty({ example: 'José' })
  name: string;

  @ApiProperty({
    example: 2,
    description:
      'Limit of sales (deals with status success) completed in week.',
  })
  limitSales: number;

  @ApiProperty({
    example: 20,
    description: 'Difference percentage at relation a team in week.',
  })
  percentageSalesAboveAverage: number;
}

class ReportWeekly {
  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 'Store Exemplo' })
  name: string;

  @ApiProperty({ example: 2 })
  newSalespeople: number;

  @ApiProperty()
  newDeals: NewDeals;

  @ApiProperty()
  salespersonHighlight: SalespersonHighlight;
}

export class GetReportWeeklyOutput {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty()
  data: ReportWeekly;
}
