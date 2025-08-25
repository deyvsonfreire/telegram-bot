import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Confirmação da senha' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ description: 'Role do usuário', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}
