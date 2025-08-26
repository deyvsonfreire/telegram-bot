import { Controller, Post, Body, UseGuards, Request, Get, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto, LoginDto, RegisterDto } from './dto';
import { Response, Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    // Cookie httpOnly com flags condicionais por ambiente
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
    });

    return { user: result.user };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/local')
  @ApiOperation({ summary: 'Login com estratégia local' })
  async loginLocal(@Request() req) {
    return this.authService.loginUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar token JWT' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Fazer logout' })
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Limpa cookie do token
    res.clearCookie('access_token', { path: '/' });
    return this.authService.logout(req.user.id);
  }

  @Get('csrf')
  @ApiOperation({ summary: 'Obter token CSRF' })
  async getCsrf(@Req() req: ExpressRequest) {
    // csurf injeta a função csrfToken em req
    const token = (req as any).csrfToken?.() as string | undefined;
    return { csrfToken: token };
  }
}
