import {
  IsArray,
  IsHexColor,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
export class UpdateCustomizationDto {
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug?: string;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logoLightUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logoDarkUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  faviconUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  loginBackgroundUrl?: string;
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsHexColor() secondaryColor?: string;
  @IsOptional() @IsHexColor() accentColor?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) openingTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) closingTime?: string;
  @IsOptional()
  @IsArray()
  @IsIn([0, 1, 2, 3, 4, 5, 6], { each: true })
  workingDays?: number[];
  @IsOptional() @IsObject() commissionRules?: Record<string, number>;
}
