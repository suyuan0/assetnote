import { Test } from '@nestjs/testing';

import databaseConfig from '../config/database.config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('disconnects when the Nest module closes', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: databaseConfig.KEY,
          useValue: {
            url: 'postgresql://test:test@127.0.0.1:1/assetnote_test',
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(PrismaService);
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    try {
      await moduleRef.close();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    } finally {
      disconnectSpy.mockRestore();
      await service.$disconnect();
    }
  });
});
