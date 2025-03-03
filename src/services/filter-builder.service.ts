import { Inject, Injectable, Optional } from "@nestjs/common";
import { INestjsDynamicFilterOptions } from "../interfaces/filter-options.interface";

@Injectable()
export class FilterBuilderService {
  private readonly queryBuilders: Map<
    string,
    (field: string, value: any) => any
  >;

  constructor(
    @Optional()
    @Inject("FILTER_OPTIONS")
    private options?: INestjsDynamicFilterOptions
  ) {
    this.queryBuilders = new Map<string, (field: string, value: any) => any>([
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
          const condition = queryBuilder(field, value);
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

  private buildSqlQuery(filterDto: any): Record<string, any> {
    // Implementation for SQL databases
    // This would return a query builder instance or SQL conditions
    throw new Error("SQL query building not yet implemented");
  }

  // Query builder methods
  private buildExactMatch(field: string, value: any) {
    return { $eq: [`$${field}`, value] };
  }

  private buildIContains(field: string, value: string) {
    return { $regexMatch: { input: `$${field}`, regex: value, options: "i" } };
  }

  private buildGte(field: string, value: any) {
    return { $expr: { $gte: [{ $toDecimal: `$${field}` }, { $toDecimal: value.toString() }] } };
  }
  
  private buildLte(field: string, value: any) {
    return { $expr: { $lte: [{ $toDecimal: `$${field}` }, { $toDecimal: value.toString() }] } };
  }

  private buildIn(field: string, value: any) {
    return { $in: [`$${field}`, Array.isArray(value) ? value : [value]] };
  }
}
