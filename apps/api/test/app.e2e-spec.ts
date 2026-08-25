import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureHttpApplication } from './../src/common/bootstrap/configure-http-application';
import applicationConfig, {
  type ApplicationConfig,
} from './../src/common/config/application.config';
import databaseConfig from './../src/common/config/database.config';

const TEST_APPLICATION_CONFIG = {
  environment: 'test',
  port: 3001,
  webOrigin: 'http://localhost:3000',
  sessionCookie: {
    name: 'assetnote_session',
    secure: false,
  },
} satisfies ApplicationConfig;

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(databaseConfig.KEY)
      .useValue({
        url: 'postgresql://test:test@127.0.0.1:1/assetnote_test',
      })
      .overrideProvider(applicationConfig.KEY)
      .useValue(TEST_APPLICATION_CONFIG)
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttpApplication(app, TEST_APPLICATION_CONFIG);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('AssetNote API 服务运行正常。');
  });

  it('returns one Chinese message for an unknown route', () => {
    return request(app.getHttpServer())
      .get('/api/unknown-route')
      .expect(404)
      .expect({ message: '请求的资源不存在。' });
  });

  afterEach(async () => {
    await app.close();
  });
});
