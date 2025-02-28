import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { FilterOperationType } from "../enums";
import { IFilterableFieldOptions } from '../interfaces';
import { FILTERABLE_FIELD_KEY } from "../constants";

export function FilterableField(options?: IFilterableFieldOptions) {
  return (target: any, propertyKey: string) => {
    const operations = options?.operations || [FilterOperationType.ICONTAINS];
    const propertyType = Reflect.getMetadata(
      'design:type',
      target,
      propertyKey,
    );

    // Apply additional properties for each operation
    operations.forEach((operation) => {
      const suffixedKey = `${propertyKey}__${operation.toLowerCase()}`;

      // Determine the type based on the operation
      let operationType = propertyType;
      if (operation === FilterOperationType.IN) {
        operationType = [propertyType];
      }

      ApiProperty({
        required: false,
        type: operationType,
        description: `Filter ${propertyKey} by ${operation} operation`,
      })(target, suffixedKey);
      IsOptional()(target, suffixedKey);

      // Add class-validator decorations based on type
      switch (propertyType) {
        case String: {
          IsString()(target, suffixedKey);
          break;
        }
        case Number: {
          Transform(({ value }) => parseFloat(value))(target, suffixedKey); 
          IsNumber()(target, suffixedKey);
          IsOptional()(target, `${propertyKey}__gte`);
          IsOptional()(target, `${propertyKey}__lte`);
          break;
        }
        case Function: {
          const enumValues = Object.values(propertyType);
          if (enumValues.length > 0 && typeof enumValues[0] === 'string') {
            IsEnum(propertyType)(target, suffixedKey);
          }
          break;
        }
        case Boolean: {
          IsBoolean()(target, suffixedKey);
        }
        default: {
          IsOptional();
        }
      }
    });

    const existingFields =
      Reflect.getMetadata(FILTERABLE_FIELD_KEY, target.constructor) || [];
    const fieldName = options?.fieldName || propertyKey;

    Reflect.defineMetadata(
      FILTERABLE_FIELD_KEY,
      [
        ...existingFields,
        {
          field: options?.fieldName || propertyKey, options,
          operations: options?.operations || [FilterOperationType.ICONTAINS],
          propertyKey,
          enum: options?.enum,
        },
      ],
      target.constructor,
    );
  };
}
