import { Global, Module } from '@nestjs/common';
import { InMemoryRateLimiter } from './in-memory-rate-limiter';

@Global()
@Module({
  providers: [InMemoryRateLimiter],
  exports: [InMemoryRateLimiter],
})
export class CommonModule {}
