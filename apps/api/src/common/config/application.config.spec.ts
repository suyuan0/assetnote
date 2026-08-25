import {
  type ApplicationConfig,
  type ApplicationConfigInput,
  parseApplicationConfig,
} from './application.config';

function parseConfig(
  overrides: Partial<ApplicationConfigInput> = {},
): ApplicationConfig {
  return parseApplicationConfig({
    nodeEnv: undefined,
    port: undefined,
    webOrigin: undefined,
    ...overrides,
  });
}

describe('parseApplicationConfig', () => {
  it('uses safe local-development defaults', () => {
    expect(parseConfig()).toEqual({
      environment: 'development',
      port: 3001,
      webOrigin: 'http://localhost:3000',
      sessionCookie: {
        name: 'assetnote_session',
        secure: false,
      },
    });
  });

  it('uses a secure host-scoped cookie in production', () => {
    expect(
      parseConfig({
        nodeEnv: ' production ',
        port: ' 443 ',
        webOrigin: 'https://app.assetnote.example/',
      }),
    ).toEqual({
      environment: 'production',
      port: 443,
      webOrigin: 'https://app.assetnote.example',
      sessionCookie: {
        name: '__Host-assetnote_session',
        secure: true,
      },
    });
  });

  it('rejects an unsupported environment', () => {
    expect(() => parseConfig({ nodeEnv: 'staging' })).toThrow(
      'NODE_ENV 只能是 development、test 或 production。',
    );
  });

  it.each(['', '0', '-1', '1.5', '65536', 'not-a-port'])(
    'rejects invalid port %p',
    (port) => {
      expect(() => parseConfig({ port })).toThrow(
        'PORT 必须是 1 至 65535 之间的整数。',
      );
    },
  );

  it('requires an explicit Web origin in production', () => {
    expect(() => parseConfig({ nodeEnv: 'production' })).toThrow(
      '生产环境必须配置 WEB_ORIGIN。',
    );
  });

  it('requires HTTPS in production', () => {
    expect(() =>
      parseConfig({
        nodeEnv: 'production',
        webOrigin: 'http://app.assetnote.example',
      }),
    ).toThrow('生产环境的 WEB_ORIGIN 必须使用 https://。');
  });

  it('rejects a blank Web origin', () => {
    expect(() => parseConfig({ webOrigin: '   ' })).toThrow(
      'WEB_ORIGIN 不能为空。',
    );
  });

  it.each([
    {
      webOrigin: 'not-an-origin',
      expectedMessage: 'WEB_ORIGIN 必须是有效的 HTTP 来源地址。',
    },
    {
      webOrigin: 'ftp://app.assetnote.example',
      expectedMessage: 'WEB_ORIGIN 必须使用 http:// 或 https:// 协议。',
    },
    {
      webOrigin: 'https://user:password@app.assetnote.example',
      expectedMessage: 'WEB_ORIGIN 不能包含身份凭据、路径、查询参数或片段。',
    },
    {
      webOrigin: 'https://app.assetnote.example/path',
      expectedMessage: 'WEB_ORIGIN 不能包含身份凭据、路径、查询参数或片段。',
    },
    {
      webOrigin: 'https://app.assetnote.example?debug=true',
      expectedMessage: 'WEB_ORIGIN 不能包含身份凭据、路径、查询参数或片段。',
    },
  ])('rejects invalid origin $webOrigin', ({ webOrigin, expectedMessage }) => {
    expect(() => parseConfig({ webOrigin })).toThrow(expectedMessage);
  });
});
