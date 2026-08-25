import { isEmail } from 'class-validator';

import { normalizeEmail } from '../../domain/normalize-email';

const MINIMUM_PASSWORD_LENGTH = 8;
const MAXIMUM_PASSWORD_LENGTH = 128;
const MAXIMUM_EMAIL_LENGTH = 254;

export interface BootstrapSuperAdminPromptInput {
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

export interface ValidatedBootstrapSuperAdminInput {
  readonly email: string;
  readonly password: string;
}

export class BootstrapSuperAdminInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BootstrapSuperAdminInputError.name;
  }
}

export function validateBootstrapSuperAdminInput(
  input: BootstrapSuperAdminPromptInput,
): ValidatedBootstrapSuperAdminInput {
  const normalizedEmail = normalizeEmail(input.email);

  if (
    normalizedEmail.length > MAXIMUM_EMAIL_LENGTH ||
    !isEmail(normalizedEmail)
  ) {
    throw new BootstrapSuperAdminInputError(
      '邮箱格式不正确，且长度不能超过 254 个字符。',
    );
  }

  if (
    input.password.length < MINIMUM_PASSWORD_LENGTH ||
    input.password.length > MAXIMUM_PASSWORD_LENGTH ||
    !/\S/u.test(input.password)
  ) {
    throw new BootstrapSuperAdminInputError(
      '密码长度必须为 8 至 128 个字符，且不能全部为空白字符。',
    );
  }

  if (input.password !== input.passwordConfirmation) {
    throw new BootstrapSuperAdminInputError('两次输入的密码不一致。');
  }

  return {
    email: normalizedEmail,
    password: input.password,
  };
}
