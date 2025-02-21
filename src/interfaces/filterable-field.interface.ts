import { ValidationOptions } from "class-validator";
import { FilterOperationType } from "../enums/filter-operation-type.enum";

export interface IFilterableFieldOptions extends ValidationOptions {
  operations?: FilterOperationType[];
  fieldName?: string;
  enum?: any;
}
