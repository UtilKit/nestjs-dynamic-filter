import { Inject, Injectable, Optional } from "@nestjs/common";
import { FindOptionsWhere, ILike, MoreThanOrEqual, LessThanOrEqual, In } from "typeorm";
import { INestjsDynamicFilterOptions } from "../interfaces/filter-options.interface";

@Injectable()
export class FilterBuilderService {
  private readonly queryBuilders: Map<
    string,
    (field: string, value: any, dbType: string) => any
  >;

  constructor(
    @Optional()
    @Inject("FILTER_OPTIONS")
    private options?: INestjsDynamicFilterOptions
  ) {
    this.queryBuilders = new Map<string, (field: string, value: any, dbType: string) => any>([
      ["exact", this.buildExactMatch],
      ["icontains", this.buildIContains],
      ["gte", this.buildGte],
      ["lte", this.buildLte],
      ["in", this.buildIn],
    ]);

    // Register custom operators
    if (options?.customOperators) {
      Object.entries(options.customOperators).forEach(([key, builder]) => {
        this.queryBuilders.set(key, builder);
      });
    }
  }

  buildQuery(filterDto: any): Record<string, any> {
    const dbType = this.options?.databaseType || "mongodb";
    return dbType === "mongodb"
      ? this.buildMongooseQuery(filterDto)
      : this.buildSqlQuery(filterDto);
  }

  private buildMongooseQuery(filterDto: any): Record<string, any> {
    const query: Record<string, any> = {
      $expr: { $and: [] },
    };

    for (const [key, value] of Object.entries(filterDto)) {
      if (value === undefined) continue;

      if (key.includes("__")) {
        const [field, operator] = key.split("__");
        const queryBuilder = this.queryBuilders.get(operator);

        if (queryBuilder) {
          const condition = queryBuilder(field, value, "mongodb");
          if (condition) {
            query.$expr.$and.push(condition);
          }
        }
      } else {
        query[key] = value;
      }
    }

    return query;
  }

  private buildSqlQuery(filterDto: any): FindOptionsWhere<any> {
    const where: FindOptionsWhere<any> = {};

    for (const [key, value] of Object.entries(filterDto)) {
      if (value === undefined) continue;

      if (key.includes("__")) {
        const [field, operator] = key.split("__");
        const queryBuilder = this.queryBuilders.get(operator);

        if (queryBuilder) {
          const condition = queryBuilder(field, value, "postgres");
          if (condition) {
            Object.assign(where, condition);
          }
        }
      } else {
        where[key] = value;
      }
    }

    return where;
  }

  // Query builder methods
  private buildExactMatch(field: string, value: any, dbType: string) {
    if (dbType === "mongodb") {
      return { $eq: [`$${field}`, value] };
    }
    // PostgreSQL/TypeORM
    return { [field]: value };
  }

  private buildIContains(field: string, value: string, dbType: string) {
    if (dbType === "mongodb") {
      return {
        $regexMatch: {
          input: { $toString: `$${field}` },
          regex: value,
          options: "i",
        },
      };
    }
    // PostgreSQL/TypeORM - use ILike for case-insensitive search
    return { [field]: ILike(`%${value}%`) };
  }

  private buildGte(field: string, value: any, dbType: string) {
    if (dbType === "mongodb") {
      // Check if value is a date
      if (value instanceof Date || (!isNaN(Date.parse(value)))) {
        return {
          $expr: {
            $gte: [`$${field}`, new Date(value)],
          },
        };
      }
      // Default decimal comparison for numbers
      return {
        $expr: {
          $gte: [{ $toDecimal: `$${field}` }, { $toDecimal: value.toString() }],
        },
      };
    }
    // PostgreSQL/TypeORM
    const parsedValue = value instanceof Date || (!isNaN(Date.parse(value)))
      ? new Date(value) 
      : typeof value === 'number' 
        ? value 
        : parseFloat(value);
    
    return { [field]: MoreThanOrEqual(parsedValue) };
  }

  private buildLte(field: string, value: any, dbType: string) {
    if (dbType === "mongodb") {
      // Check if value is a date
      if (value instanceof Date || (!isNaN(Date.parse(value)))) {
        return {
          $expr: {
            $lte: [`$${field}`, new Date(value)],
          },
        };
      }
      // Default decimal comparison for numbers
      return {
        $expr: {
          $lte: [{ $toDecimal: `$${field}` }, { $toDecimal: value.toString() }],
        },
      };
    }
    // PostgreSQL/TypeORM
    const parsedValue = value instanceof Date || (!isNaN(Date.parse(value)))
      ? new Date(value) 
      : typeof value === 'number' 
        ? value 
        : parseFloat(value);
    
    return { [field]: LessThanOrEqual(parsedValue) };
  }

  private buildIn(field: string, value: any, dbType: string) {
    if (dbType === "mongodb") {
      return { $in: [`$${field}`, Array.isArray(value) ? value : [value]] };
    }
    // PostgreSQL/TypeORM
    return { [field]: In(Array.isArray(value) ? value : [value]) };
  }
}
