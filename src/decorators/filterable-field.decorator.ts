import { ApiProperty } from "@nestjs/swagger";
import { FilterOperationType } from "../enums";
import { IFilterableFieldOptions } from "../interfaces";
import { FILTERABLE_FIELD_KEY } from "../constants";

export function FilterableField(options?: IFilterableFieldOptions) {
  return (target: any, propertyKey: string) => {
    const operations = options?.operations || [FilterOperationType.ICONTAINS];
    const propertyType = Reflect.getMetadata(
      "design:type",
      target,
      propertyKey
    );

    operations.forEach((operation) => {
      const suffixedKey = `${propertyKey}__${operation.toLowerCase()}`;

      // Enhanced property decoration
      ApiProperty({
        required: false,
        type: propertyType,
        description: `Filter ${propertyKey} by ${operation} operation`,
      })(target, suffixedKey);
    });

    // Store metadata for reflection
    const existingFields =
      Reflect.getMetadata(FILTERABLE_FIELD_KEY, target.constructor) || [];
    Reflect.defineMetadata(
      FILTERABLE_FIELD_KEY,
      [
        ...existingFields,
        { field: options?.fieldName || propertyKey, options },
      ],
      target.constructor
    );
  };
}
