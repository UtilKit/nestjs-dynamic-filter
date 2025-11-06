import { Inject, Injectable, Optional } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Model } from "mongoose";
import { Repository, SelectQueryBuilder } from "typeorm";
import { FILTERABLE_FIELD_KEY } from "../constants";
import { FilterOperationType } from "../enums/filter-operation-type.enum";
import { INestjsDynamicFilterOptions } from "../interfaces/filter-options.interface";

@Injectable()
export class FilterService {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject("FILTER_OPTIONS")
    private options?: INestjsDynamicFilterOptions
  ) {}

  async getFilters(dto: any, model: Model<any> | Repository<any>): Promise<any> {
    const filterMetadata = this.reflector.get(FILTERABLE_FIELD_KEY, dto) || [];
    const result = {
      filters: {},
      search: [],
      fields: {},
    };

    for (const field of filterMetadata) {
      await this.processFieldMetadata(field, model, result);
    }

    return result;
  }

  private async processFieldMetadata(
    field: any,
    model: Model<any> | Repository<any>,
    result: any
  ) {
    const { filters, search, fields } = result;

    fields[field.field] = field.options?.operations || [
      FilterOperationType.ICONTAINS,
    ];

    if (fields[field.field]?.includes(FilterOperationType.ICONTAINS)) {
      search.push(field.field);
    }

    if (field.options?.enum) {
      filters[field.field] = {
        exact: Object.entries(field.options.enum).map(
          ([key, value]: [string, string]) => ({
            value,
            label: this.formatEnumLabel(key),
          })
        ),
      };
    }

    if (
      fields[field.field]?.some((op) =>
        [FilterOperationType.GTE, FilterOperationType.LTE].includes(op)
      )
    ) {
      const stats = await this.getFieldStats(field.field, model);
      if (stats) {
        filters[field.field] = {
          min: stats.min,
          max: stats.max,
        };
      }
    }
  }

  private formatEnumLabel(value: string): string {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private async getFieldStats(
    field: string,
    model: Model<any> | Repository<any>
  ) {
    const dbType = this.options?.databaseType || "mongodb";

    if (dbType === "mongodb") {
      // MongoDB/Mongoose
      const mongooseModel = model as Model<any>;
      const stats = await mongooseModel.aggregate([
        {
          $group: {
            _id: null,
            min: { $min: `$${field}` },
            max: { $max: `$${field}` },
          },
        },
      ]);

      return stats.length > 0 ? { min: stats[0].min, max: stats[0].max } : null;
    } else {
      // PostgreSQL/TypeORM
      const repository = model as Repository<any>;
      const queryBuilder: SelectQueryBuilder<any> = repository
        .createQueryBuilder()
        .select(`MIN(${field})`, "min")
        .addSelect(`MAX(${field})`, "max");

      const result = await queryBuilder.getRawOne();

      return result && (result.min !== null || result.max !== null)
        ? { min: result.min, max: result.max }
        : null;
    }
  }
}
