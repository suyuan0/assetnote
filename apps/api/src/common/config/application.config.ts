import { registerAs } from '@nestjs/config';

const APPLICATION_ENVIRONMENTS = ['development', 'test', 'production'] as const;

const DEFAULT_PORT = 3001;
const DEFAULT_WEB_ORIGIN = 'http://localhost:3000';
const WEB_PROTOCOLS = new Set(['http:', 'https:']);

export type ApplicationEnvironment = (typeof APPLICATION_ENVIRONMENTS)[number];

export interface ApplicationConfigInput {
  readonly nodeEnv: string | undefined;
  readonly port: string | undefined;
  readonly webOrigin: string | undefined;
}

export interface ApplicationConfig {
  readonly environment: ApplicationEnvironment;
  readonly port: number;
  readonly webOrigin: string;
  readonly sessionCookie: {
    readonly name: string;
    readonly secure: boolean;
  };
}

function isApplicationEnvironment(
  value: string,
): value is ApplicationEnvironment {
  return APPLICATION_ENVIRONMENTS.some((environment) => environment === value);
}

function parseEnvironment(value: string | undefined): ApplicationEnvironment {
  const environment = value?.trim() ?? 'development';

  if (!isApplicationEnvironment(environment)) {
    throw new Error('NODE_ENV 只能是 development、test 或 production。');
  }

  return environment;
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const normalizedValue = value.trim();

  if (!/^[1-9]\d*$/.test(normalizedValue)) {
    throw new Error('PORT 必须是 1 至 65535 之间的整数。');
  }

  const port = Number(normalizedValue);

  if (!Number.isInteger(port) || port > 65535) {
    throw new Error('PORT 必须是 1 至 65535 之间的整数。');
  }

  return port;
}

function parseWebOrigin(
  value: string | undefined,
  environment: ApplicationEnvironment,
): string {
  const defaultOrigin =
    environment === 'production' ? undefined : DEFAULT_WEB_ORIGIN;
  const normalizedOrigin = value?.trim();

  if (value !== undefined && !normalizedOrigin) {
    throw new Error('WEB_ORIGIN 不能为空。');
  }

  const origin = normalizedOrigin ?? defaultOrigin;

  if (!origin) {
    throw new Error('生产环境必须配置 WEB_ORIGIN。');
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error('WEB_ORIGIN 必须是有效的 HTTP 来源地址。');
  }

  if (!WEB_PROTOCOLS.has(parsedOrigin.protocol)) {
    throw new Error('WEB_ORIGIN 必须使用 http:// 或 https:// 协议。');
  }

  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error('WEB_ORIGIN 不能包含身份凭据、路径、查询参数或片段。');
  }

  if (environment === 'production' && parsedOrigin.protocol !== 'https:') {
    throw new Error('生产环境的 WEB_ORIGIN 必须使用 https://。');
  }

  return parsedOrigin.origin;
}

export function parseApplicationConfig(
  input: ApplicationConfigInput,
): ApplicationConfig {
  const environment = parseEnvironment(input.nodeEnv);

  return {
    environment,
    port: parsePort(input.port),
    webOrigin: parseWebOrigin(input.webOrigin, environment),
    sessionCookie: {
      name:
        environment === 'production'
          ? '__Host-assetnote_session'
          : 'assetnote_session',
      secure: environment === 'production',
    },
  };
}

function loadApplicationConfig(): ApplicationConfig {
  return parseApplicationConfig({
    nodeEnv: process.env['NODE_ENV'],
    port: process.env['PORT'],
    webOrigin: process.env['WEB_ORIGIN'],
  });
}

export const applicationConfig = registerAs(
  'application',
  loadApplicationConfig,
);

export default applicationConfig;
