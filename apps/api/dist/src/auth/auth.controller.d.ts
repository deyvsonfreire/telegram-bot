import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Response, Request as ExpressRequest } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        user: any;
    }>;
    loginLocal(req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    refreshToken(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    logout(req: any, res: Response): Promise<{
        message: string;
    }>;
    getCsrf(req: ExpressRequest): Promise<{
        csrfToken: string;
    }>;
}
