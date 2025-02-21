export interface INestjsFilterOptions {
  // Global configuration options
  enableSwaggerDocs?: boolean;
  // Support for different databases
  databaseType?: "mongodb" | "postgres";
  // Custom query builder options
  customOperators?: Record<string, (field: string, value: any) => any>;
}
