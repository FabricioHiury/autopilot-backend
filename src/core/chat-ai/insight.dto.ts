import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
class LeadDossierDto {
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  vehicleOfInterest: string | null;
  @ValidateIf((_, value) => value !== null) @IsBoolean() hasTradeIn:
    | boolean
    | null;
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  tradeInVehicle: string | null;
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  paymentMethod: string | null;
  @IsIn(['HOT', 'WARM', 'COLD', 'UNKNOWN']) perceivedTemperature: string;
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  mainObjection: string | null;
}
export class InsightDto {
  @ValidateNested() @Type(() => LeadDossierDto) leadDossier: LeadDossierDto;
  @IsString() @MaxLength(2000) nextBestAction: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  quickReplies: string[];
}
