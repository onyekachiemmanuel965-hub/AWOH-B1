import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function trimString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export class RegisterDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  /** Min length enforced; detailed policy checked in service. */
  password!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{M}\s'-]+$/u, {
    message: 'firstName contains invalid characters',
  })
  firstName!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{M}\s'-]+$/u, {
    message: 'lastName contains invalid characters',
  })
  lastName!: string;
}

export class LoginDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
