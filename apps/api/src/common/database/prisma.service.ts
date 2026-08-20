import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client';
import databaseConfig from '../config/database.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(
    @Inject(databaseConfig.KEY)
    config: ConfigType<typeof databaseConfig>,
  ) {
    const adapter = new PrismaPg({
      connectionString: config.url,
    });

    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
