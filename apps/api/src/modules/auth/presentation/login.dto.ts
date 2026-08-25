import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

function trimEmail({ value: inputValue }: TransformFnParams): unknown {
  const value: unknown = inputValue;

  return typeof value === 'string' ? value.trim() : value;
}

export class LoginRequestDto {
  @Transform(trimEmail)
  @IsString({ message: '邮箱必须是字符串。' })
  @IsEmail({}, { message: '邮箱格式不正确。' })
  @MaxLength(254, { message: '邮箱长度不能超过 254 个字符。' })
  email!: string;

  @IsString({ message: '密码必须是字符串。' })
  @MinLength(1, { message: '密码不能为空。' })
  @MaxLength(1024, { message: '密码长度不能超过 1024 个字符。' })
  password!: string;
}
