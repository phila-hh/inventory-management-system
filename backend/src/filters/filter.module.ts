import { Global, Module } from '@nestjs/common';
import { FilterService } from './filter.service';

@Global()
@Module({
  imports: [],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
