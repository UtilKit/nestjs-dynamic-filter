import { DynamicModule, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { INestjsDynamicFilterOptions } from "./interfaces/filter-options.interface";
import { FilterBuilderService } from "./services/filter-builder.service";
import { FilterService } from "./services/filter.service";

@Module({})
export class NestjsDynamicFilterModule {
  static forRoot(options?: INestjsDynamicFilterOptions): DynamicModule {
    return {
      module: NestjsDynamicFilterModule,
      global: true,
      providers: [
        Reflector,
        FilterBuilderService,
        FilterService,
        {
          provide: "FILTER_OPTIONS",
          useValue: options || {},
        },
      ],
      exports: [FilterBuilderService, FilterService],
    };
  }
}
