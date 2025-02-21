# nestjs-dynamic-filter

A flexible filtering system for NestJS applications, inspired by django-filter. This package provides an easy way to implement complex filtering in your NestJS applications with MongoDB support.

## Installation

```bash
npm install nestjs-dynamic-filter
```

## Features

- Easy-to-use decorators for defining filterable fields
- Support for multiple filter operations (exact, contains, greater than, less than, etc.)
- Automatic Swagger documentation
- Built-in pagination support
- MongoDB/Mongoose integration
- Type-safe filtering

## Quick Start

1. Import the NestjsFilterModule in your app.module.ts:

```typescript
import { NestjsFilterModule } from 'nestjs-dynamic-filter';

@Module({
  imports: [
    NestjsFilterModule.forRoot(),
    // ... other imports
  ],
})
export class AppModule {}
```

2. Define your filter DTO:

```typescript
import { FilterableField, FilterOperationType } from 'nestjs-dynamic-filter';
import { PaginationQueryDto } from 'nestjs-dynamic-filter';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class UserFilterDto extends PaginationQueryDto {
  @FilterableField()
  name?: string;

  @FilterableField({
    operations: [FilterOperationType.EXACT],
    enum: UserStatus
  })
  status?: UserStatus;

  @FilterableField({
    operations: [FilterOperationType.GTE, FilterOperationType.LTE]
  })
  age?: number;
}
```

3. Use in your controller:

```typescript
import { FilterBuilderService } from 'nestjs-dynamic-filter';

@Controller('users')
export class UserController {
  constructor(
    private readonly filterBuilder: FilterBuilderService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async findAll(@Query() query: UserFilterDto) {
    const filter = this.filterBuilder.buildQuery(query);
    return this.userService.find(filter);
  }
}
```

## Filter Operations

- `exact`: Exact match
- `icontains`: Case-insensitive contains
- `in`: Value in array
- `gte`: Greater than or equal
- `lte`: Less than or equal

## Query Parameters

For a field named `age`, you can use:
- `age__exact=25`
- `age__gte=18`
- `age__lte=65`

For text fields:
- `name__icontains=john`

## Advanced Usage

### Getting Available Filters

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly filterService: FilterService) {}

  @Get('@filters')
  async getFilters() {
    return this.filterService.getFilters(UserFilterDto, this.userModel);
  }
}
```

### Custom Filter Operations

```typescript
@FilterableField({
  operations: [
    FilterOperationType.EXACT,
    FilterOperationType.ICONTAINS,
    FilterOperationType.IN
  ]
})
field?: string;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT