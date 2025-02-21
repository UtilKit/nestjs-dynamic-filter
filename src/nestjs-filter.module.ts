import { DynamicModule, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { INestjsFilterOptions } from "./interfaces/filter-options.interface";
import { FilterBuilderService } from "./services/filter-builder.service";
import { FilterService } from "./services/filter.service";

@Module({})
export class NestjsFilterModule {
  static forRoot(options?: INestjsFilterOptions): DynamicModule {
    return {
      module: NestjsFilterModule,
      providers: [
        FilterBuilderService,
        FilterService,
        Reflector,
        {
          provide: "FILTER_OPTIONS",
          useValue: options || {},
        },
      ],
      exports: [FilterBuilderService, FilterService],
    };
  }
}
