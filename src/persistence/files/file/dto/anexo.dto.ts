import { IsString, IsNotEmpty } from 'class-validator';

export class AnexoDto {
    @IsNotEmpty()
    @IsString()
    readonly anexo: string
}