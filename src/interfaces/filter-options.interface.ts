export interface INestjsDynamicFilterOptions {
  // Global configuration options
  enableSwaggerDocs?: boolean;
  // Support for different databases
  databaseType?: "mongodb" | "postgres";
  // Custom query builder options
  // Custom operators should accept (field: string, value: any, dbType: string) => any
  customOperators?: Record<string, (field: string, value: any, dbType: string) => any>;
}
