import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function readConstraintMessage(error: ValidationError): string | undefined {
  if (!error.constraints) {
    return undefined;
  }

  if (error.constraints.whitelistValidation) {
    return '请求中包含不允许的字段。';
  }

  if (error.constraints.unknownValue) {
    return '请求参数格式不正确。';
  }

  return Object.values(error.constraints)[0];
}

function findFirstValidationMessage(
  errors: ValidationError[],
): string | undefined {
  for (const error of errors) {
    const constraintMessage = readConstraintMessage(error);

    if (constraintMessage) {
      return constraintMessage;
    }

    const childMessage = findFirstValidationMessage(error.children ?? []);

    if (childMessage) {
      return childMessage;
    }
  }

  return undefined;
}

export function createValidationException(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: findFirstValidationMessage(errors) ?? '请求参数不正确。',
  });
}
