export class InvalidCredentialsError extends Error {
  constructor() {
    super('邮箱或密码错误。');
    this.name = InvalidCredentialsError.name;
  }
}
