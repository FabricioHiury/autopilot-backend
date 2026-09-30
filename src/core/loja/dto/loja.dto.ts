import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    IsStrongPassword
} from "class-validator";
import { EstadosBrasileirosEnum } from "src/utils/enum/estados.enum";

export class LoginLojistaDto {

    @ApiProperty({ example: "usuario@exemplo.com", description: "Email do lojista" })
    @IsEmail()
    email: string;

    @ApiProperty({ example: "@Senha123", description: "Senha forte do lojista" })
    @IsStrongPassword()
    senha: string;
}

export class LojistaDadosDto {

    @ApiProperty({ example: 1, description: "ID único do lojista" })
    @IsString()
    id: string;

    @ApiProperty({ example: 100, description: "ID do usuário associado" })
    @IsString()
    idUsuario: string;

    @ApiProperty({ example: true, description: "Status do lojista" })
    @IsBoolean()
    status: boolean;
}

export class ListarLojaResponse {

    @ApiProperty({ example: "Nome da Empresa", description: "Nome da empresa cadastrada" })
    nomeEmpresa: string;

    @ApiProperty({ example: "0000.0000/0000-00", description: "CNPJ da empresa" })
    cnpj: string;
}

export class ListarLojaDto {

    @ApiPropertyOptional({ example: 'Pesquisa', default: '', description: "Termo de pesquisa", required: false })
    @IsOptional()
    @IsString()
    pesquisa: string;

    @ApiPropertyOptional({ example: '1', default: '1', description: "Número da página", required: false })
    @IsOptional()
    @IsNumberString()
    pagina: string;

    @ApiPropertyOptional({ example: '10', default: '10', description: "Quantidade de itens por página", required: false })
    @IsOptional()
    @IsNumberString()
    quantidade: string;
}

export class CadastroLojistaDto {

    @ApiProperty({ example: "mail@mail.com", description: "Email do lojista" })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "@Senha123", description: "Senha forte do lojista" })
    @IsString()
    @IsStrongPassword()
    @IsNotEmpty()
    senha: string;

    @ApiProperty({ example: "0000.0000.00/0000-00", description: "Documento fiscal da empresa" })
    @IsNotEmpty()
    documentoFiscal: string;

    @ApiProperty({ example: "Fulano Oliveira", description: "Nome completo do lojista" })
    @IsNotEmpty()
    nome: string;

    @ApiProperty({ example: "CE", enum: EstadosBrasileirosEnum, description: "Unidade Federativa (UF)" })
    @IsNotEmpty()
    uf: EstadosBrasileirosEnum;

    @ApiProperty({ example: "Crato", description: "Cidade onde a empresa está localizada" })
    @IsNotEmpty()
    cidade: string;

    @ApiPropertyOptional({ example: true, description: "Status do lojista", default: true })
    @IsBoolean()
    @IsOptional()
    status: boolean = true;

    @ApiPropertyOptional({ example: "João Silva", description: "Nome do responsável pela conta" })
    @IsString()
    @IsOptional()
    responsavel?: string;

    @ApiPropertyOptional({ example: "11987654321", description: "Telefone/WhatsApp de contato" })
    @IsString()
    @IsOptional()
    telefone?: string;

    @ApiPropertyOptional({ example: "12345-678", description: "CEP do endereço" })
    @IsString()
    @IsOptional()
    cep?: string;

    @ApiPropertyOptional({ example: "Rua das Flores", description: "Nome da rua" })
    @IsString()
    @IsOptional()
    rua?: string;

    @ApiPropertyOptional({ example: "123", description: "Número do endereço" })
    @IsString()
    @IsOptional()
    numero?: string;

    @ApiPropertyOptional({ example: "Apto 101", description: "Complemento do endereço" })
    @IsString()
    @IsOptional()
    complemento?: string;

    @ApiPropertyOptional({ example: "Centro", description: "Bairro" })
    @IsString()
    @IsOptional()
    bairro?: string;
}

export class CadastroEnderecoDto {
    @ApiProperty({ example: 1, description: "Deve ser informado caso queira editar um endereço", required: false })
    @IsOptional()
    @IsString()
    idEndereco?: string;

    @ApiPropertyOptional({ example: "Rua Exemplo", description: "Nome da rua", required: false })
    @IsString()
    @IsOptional()
    rua?: string;

    @ApiPropertyOptional({ example: "12345-678", description: "CEP", required: false })
    @IsString()
    @IsOptional()
    cep?: string;

    @ApiProperty({ example: "São Paulo", description: "Cidade" })
    @IsString()
    @IsNotEmpty()
    cidade: string;

    @ApiProperty({ example: "SP", enum: EstadosBrasileirosEnum, description: "Unidade Federativa (UF)" })
    @IsEnum(EstadosBrasileirosEnum)
    @IsNotEmpty()
    uf: string;

    @ApiPropertyOptional({ example: "Bairro Exemplo", description: "Bairro", required: false })
    @IsString()
    @IsOptional()
    bairro?: string;

    @ApiPropertyOptional({ example: "1000", description: "Número da residência", required: false })
    @IsString()
    @IsOptional()
    numero?: string;

    @ApiPropertyOptional({ example: "Apto 101", description: "Complemento", required: false })
    @IsOptional()
    @IsString()
    complemento?: string;

    @ApiProperty({ example: true, description: "Indica se é uma filial" })
    @IsBoolean()
    @IsNotEmpty()
    filial: boolean;
}

export class EditarContatoDto {
    @ApiProperty({ example: 1, description: "Deve ser informado caso queira editar um contato", required: false })
    @IsOptional()
    @IsString()
    idContato?: string;

    @ApiProperty({ example: "www.siteexemplo.com", description: "Website da loja", required: false })
    @IsOptional()
    @IsString()
    site?: string;

    @ApiProperty({ example: "João Silva", description: "Nome do contato" })
    @IsNotEmpty()
    @IsString()
    nome: string;

    @ApiProperty({ example: "(11) 91234-5678", description: "Número de celular" })
    @IsNotEmpty()
    @IsString()
    celular: string;

    @ApiProperty({ example: "(11) 1234-5678", description: "Número de telefone fixo" })
    @IsOptional()
    @IsString()
    telefone?: string;

    @ApiProperty({ example: "contato@lojaexemplo.com", description: "Email de contato" })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

export class EditarLojaDto {

    @ApiProperty({ example: "Nome da Empresa", description: "Nome da empresa proprietária", required: false })
    @IsOptional()
    @IsString()
    nomeEmpresa?: string;

    @ApiProperty({ example: "", required: false })
    @IsOptional()
    @IsString()
    cnpj?: string;

    @ApiProperty({ example: "123456", description: "Inscrição Municipal", required: false })
    @IsNotEmpty()
    @IsOptional()
    inscricaoMunicipal?: string;

    @ApiProperty({ example: "789012", description: "Inscrição Estadual", required: false })
    @IsOptional()
    @IsNotEmpty()
    inscricaoEstadual?: string;

    @ApiProperty({ example: "Simples Nacional", description: "Regime tributário", required: false })
    @IsOptional()
    @IsNotEmpty()
    regimeTributario?: string;

    @ApiProperty({ example: "www.portalempresa.com", description: "Portal da empresa", required: false })
    @IsOptional()
    @IsNotEmpty()
    portalEmpresa?: string;

    @ApiProperty({ example: "Comércio Varejista", description: "Atividade principal", required: false })
    @IsOptional()
    @IsNotEmpty()
    atividadePrincipal?: string;

    @ApiProperty({ example: "Descrição detalhada da atividade", description: "Descrição da atividade", required: false })
    @IsOptional()
    @IsNotEmpty()
    descricaoAtividade?: string;
}
