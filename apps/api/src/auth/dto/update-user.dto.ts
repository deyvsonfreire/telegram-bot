import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Email do usuário', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Nome do usuário', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ description: 'Senha atual', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @ApiProperty({ description: 'Nova senha', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @ApiProperty({ description: 'Confirmação da nova senha', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmNewPassword?: string;
}
