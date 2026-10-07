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

export const INSIGHT_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'chat_insight',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['leadDossier', 'nextBestAction', 'quickReplies'],
      properties: {
        leadDossier: {
          type: 'object',
          additionalProperties: false,
          required: [
            'vehicleOfInterest',
            'hasTradeIn',
            'tradeInVehicle',
            'paymentMethod',
            'perceivedTemperature',
            'mainObjection',
          ],
          properties: {
            vehicleOfInterest: { type: ['string', 'null'], maxLength: 1000 },
            hasTradeIn: { type: ['boolean', 'null'] },
            tradeInVehicle: { type: ['string', 'null'], maxLength: 1000 },
            paymentMethod: { type: ['string', 'null'], maxLength: 1000 },
            perceivedTemperature: {
              type: 'string',
              enum: ['HOT', 'WARM', 'COLD', 'UNKNOWN'],
            },
            mainObjection: { type: ['string', 'null'], maxLength: 2000 },
          },
        },
        nextBestAction: { type: 'string', maxLength: 2000 },
        quickReplies: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: { type: 'string', maxLength: 2000 },
        },
      },
    },
  },
};
