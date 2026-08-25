import {
  BootstrapSuperAdminInputError,
  validateBootstrapSuperAdminInput,
} from './bootstrap-super-admin.input';

describe('validateBootstrapSuperAdminInput', () => {
  it('normalizes the email without rewriting the password', () => {
    expect(
      validateBootstrapSuperAdminInput({
        email: '  Owner@Example.COM  ',
        password: '  exact bootstrap password  ',
        passwordConfirmation: '  exact bootstrap password  ',
      }),
    ).toEqual({
      email: 'owner@example.com',
      password: '  exact bootstrap password  ',
    });
  });

  it('accepts a password at the eight-character minimum', () => {
    expect(
      validateBootstrapSuperAdminInput({
        email: 'owner@example.com',
        password: '1234567!',
        passwordConfirmation: '1234567!',
      }),
    ).toEqual({
      email: 'owner@example.com',
      password: '1234567!',
    });
  });

  it.each([
    {
      caseName: 'invalid email',
      input: {
        email: 'not-an-email',
        password: 'valid password',
        passwordConfirmation: 'valid password',
      },
      message: '邮箱格式不正确，且长度不能超过 254 个字符。',
    },
    {
      caseName: 'short password',
      input: {
        email: 'owner@example.com',
        password: 'short7!',
        passwordConfirmation: 'short7!',
      },
      message: '密码长度必须为 8 至 128 个字符，且不能全部为空白字符。',
    },
    {
      caseName: 'blank password',
      input: {
        email: 'owner@example.com',
        password: '            ',
        passwordConfirmation: '            ',
      },
      message: '密码长度必须为 8 至 128 个字符，且不能全部为空白字符。',
    },
    {
      caseName: 'mismatched confirmation',
      input: {
        email: 'owner@example.com',
        password: 'valid password',
        passwordConfirmation: 'different password',
      },
      message: '两次输入的密码不一致。',
    },
  ])('rejects $caseName', ({ input, message }) => {
    expect(() => validateBootstrapSuperAdminInput(input)).toThrow(
      BootstrapSuperAdminInputError,
    );
    expect(() => validateBootstrapSuperAdminInput(input)).toThrow(message);
  });
});
