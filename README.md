# nestjs-dynamic-filter

A flexible filtering system for NestJS applications. This package provides an easy way to implement complex filtering in your NestJS applications with MongoDB and PostgreSQL support.

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
- PostgreSQL/TypeORM integration
- Type-safe filtering
- Database-agnostic query building

## Quick Start

1. Import the NestjsDynamicFilterModule in your app.module.ts:

**For MongoDB:**
```typescript
import { NestjsDynamicFilterModule } from 'nestjs-dynamic-filter';

@Module({
  imports: [
    NestjsDynamicFilterModule.forRoot({
      databaseType: 'mongodb', // Optional, defaults to 'mongodb'
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

**For PostgreSQL:**
```typescript
import { NestjsDynamicFilterModule } from 'nestjs-dynamic-filter';

@Module({
  imports: [
    NestjsDynamicFilterModule.forRoot({
      databaseType: 'postgres',
    }),
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

**For MongoDB:**
```typescript
import { FilterBuilderService } from 'nestjs-dynamic-filter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller('users')
export class UserController {
  constructor(
    private readonly filterBuilder: FilterBuilderService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  @Get()
  async findAll(@Query() query: UserFilterDto) {
    const filter = this.filterBuilder.buildQuery(query);
    return this.userModel.find(filter).exec();
  }
}
```

**For PostgreSQL:**
```typescript
import { FilterBuilderService } from 'nestjs-dynamic-filter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('users')
export class UserController {
  constructor(
    private readonly filterBuilder: FilterBuilderService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  async findAll(@Query() query: UserFilterDto) {
    const where = this.filterBuilder.buildQuery(query);
    return this.userRepository.find({ where });
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

**For MongoDB:**
```typescript
import { FilterService } from 'nestjs-dynamic-filter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller('users')
export class UserController {
  constructor(
    private readonly filterService: FilterService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  @Get('@filters')
  async getFilters() {
    return this.filterService.getFilters(UserFilterDto, this.userModel);
  }
}
```

**For PostgreSQL:**
```typescript
import { FilterService } from 'nestjs-dynamic-filter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('users')
export class UserController {
  constructor(
    private readonly filterService: FilterService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Get('@filters')
  async getFilters() {
    return this.filterService.getFilters(UserFilterDto, this.userRepository);
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