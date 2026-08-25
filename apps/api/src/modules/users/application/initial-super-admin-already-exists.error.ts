export class InitialSuperAdminAlreadyExistsError extends Error {
  constructor() {
    super('已有用户，无法再次创建初始超级管理员。');
    this.name = InitialSuperAdminAlreadyExistsError.name;
  }
}
