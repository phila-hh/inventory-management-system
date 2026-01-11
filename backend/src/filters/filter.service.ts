import { Injectable, Scope } from '@nestjs/common';
import mongoose, { Query } from 'mongoose';
import { Model, PipelineStage } from 'mongoose';

type QueryString = {
  sort?: string;
  fields?: string;
  page?: string | number;
  limit?: string | number;
};

type ExecuteResult<T> = {
  results: T[];
  totalResults: number;
  totalPages?: number;
  limit?: number | string;
  page?: number | string;
};

@Injectable({ scope: Scope.TRANSIENT })
export class FilterService {
  private query: Query<any, any>;
  private qs: any;

  initialize(query: any, qs: any) {
    this.query = query;
    this.qs = qs;
    return this;
  }

  filter() {
    const queryObject = { ...this.qs };
    const excludedFields = [
      'page',
      'sort',
      'limit',
      'fields',
      'search',
      'operations',
    ];
    excludedFields.forEach((el) => delete queryObject[el]);

    const operators = ['gte', 'gt', 'lte', 'lt', 'eq', 'ne', 'regex', 'regex^'];
    const newQueryObject: any = {};
    const orConditions: any[] = [];

    Object.keys(queryObject).forEach((key) => {
      
      if (key.startsWith('or[')) {
        const orKey = key.slice(3, -1);
        const [field, operator] = orKey.split('][');
        let condition: any = {};
        if (operator && operators.includes(operator)) {
          if (operator === 'regex') {
            condition[field] = {
              $regex: new RegExp(`${queryObject[key]}`, 'i'),
            };
          } else if (operator === 'regex^') {
            condition[field] = {
              $regex: new RegExp(`^${queryObject[key]}`, 'i'),
            };
          } else {
            condition[field] = { [`$${operator}`]: queryObject[key] };
          }
        } else {
          condition[field] = queryObject[key];
        }
        orConditions.push(condition);
      } else {
        const [field, operator] = key.split('[');
        if (operator && operators.includes(operator.slice(0, -1))) {
          if (!newQueryObject[field]) {
            newQueryObject[field] = {};
          }
          if (operator.slice(0, -1) === 'regex') {
            newQueryObject[field][`$${operator.slice(0, -1)}`] = new RegExp(
              `${queryObject[key]}`,
              'i',
            );
          } else if (operator.slice(0, -1) === '^regex') {
            newQueryObject[field][`$${operator.slice(0, -1)}`] = new RegExp(
              `^${queryObject[key]}`,
              'i',
            );
          } else {
            newQueryObject[field][`$${operator.slice(0, -1)}`] =
              queryObject[key];
          }
        } else {
          newQueryObject[key] = queryObject[key];
        }
      }
    });

    let finalQuery: any = newQueryObject;
    if (orConditions.length > 0) {
      finalQuery = { ...newQueryObject, $or: orConditions };
    }

    this.query = this.query.find(finalQuery);
    return this;
  }

  sort() {
    const sortBy = this.qs['sort'];
    if (sortBy) {
      const sortObj: Record<string, 1 | -1> = {};
      sortBy.split(',').forEach((sortField) => {
        const [field, order] = sortField.trim().split(':');
        sortObj[field] = order === 'desc' ? -1 : 1;
      });
      this.query = this.query.sort(sortObj);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    let selectedFields = this.qs['fields'];
    if (selectedFields) {
      selectedFields = selectedFields.split(',').join(' ');
      this.query = this.query.select(selectedFields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    if (!this.qs['limit'] && !this.qs['page']) {
      return this;
    }
    const page = this.qs['page'] * 1 || 1;
    const limit = this.qs['limit'] * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    this.qs['pagination'] = { page, limit };

    return this;
  }

  async getResults(): Promise<any> {
    const results = await this.query.exec();
    const totalResults = await this.query.model
      .countDocuments(this.query.getQuery())
      .exec();
    if (this.qs['pagination']) {
      const { page, limit } = this.qs['pagination'];
      const totalPages = Math.ceil(totalResults / limit);

      return {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
    } else {
      return { results, totalResults };
    }
  }
}

@Injectable()
export class FilterAggregation<T> {
  private model: Model<T>;
  private query: any[];
  private queryString: QueryString;
  private totalResults: number;
  private totalPages: number;
  private result: T[];

  constructor(model: Model<T>, query: any[], queryString: QueryString) {
    this.model = model;
    this.query = query;
    this.queryString = queryString;
    this.totalResults = 0;
    this.totalPages = 0;
    this.result = [];
  }

  sort(): this {
    const sortBy = this.queryString.sort;
    if (sortBy) {
      const sortObj: Record<string, 1 | -1> = {};
      sortBy.split(',').forEach((sortField) => {
        const [field, order] = sortField.trim().split(':');
        sortObj[`${field}`] = order === 'desc' ? -1 : 1;
      });
      this.query.push({ $sort: sortObj });
    } else {
      this.query.push({ $sort: { createdAt: -1 } });
    }
    return this;
  }

  filter(): this {
    const queryObject = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);

    const operators = ['gte', 'gt', 'lte', 'lt', 'eq', 'regex'];
    const matchObj: any = {};

    Object.keys(queryObject).forEach((key) => {
      const [field, operator] = key.split('[');
      if (operator && operators.includes(operator.slice(0, -1))) {
        if (!matchObj[field]) {
          matchObj[field] = {};
        }
        if (operator.slice(0, -1) === 'regex') {
          matchObj[field][`$${operator.slice(0, -1)}`] = new RegExp(
            `^${queryObject[key]}`,
            'i',
          );
        } else {
          matchObj[field][`$${operator.slice(0, -1)}`] = queryObject[key];
        }
      } else {
        if (
          typeof queryObject[key] === 'string' &&
          /^[0-9a-fA-F]{24}$/.test(queryObject[key])
        ) {
          matchObj[key] = new mongoose.Types.ObjectId(queryObject[key]);
        } else {
          matchObj[key] = queryObject[key];
        }
      }
    });

    
    this.query.unshift({ $match: matchObj });
    return this;
  }

  limitFields(): this {
    const selectedFields = this.queryString.fields;
    if (selectedFields) {
      const fieldsArray = selectedFields
        .split(',')
        .reduce<Record<string, 1>>((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {});
      this.query.push({ $project: fieldsArray });
    } else {
      this.query.push({ $project: { __v: 0 } }); 
    }
    return this;
  }

  paginate(): this {
    if (this.queryString.page || this.queryString.limit) {
      const page = Number(this.queryString.page) || 1;
      const limit = Number(this.queryString.limit) || 10;

      const skip = (page - 1) * limit;

      this.query.push({ $skip: skip });
      this.query.push({ $limit: limit });
    }

    return this;
  }

  async execute(): Promise<ExecuteResult<T>> {
    this.result = await this.model.aggregate(this.query);

    const countQuery: PipelineStage[] = this.query.filter(
      (stage) => !('$limit' in stage || '$skip' in stage),
    );

    countQuery.push({ $count: 'total' });

    const output = await this.model.aggregate(countQuery);

    this.totalResults = output[0]?.total || 0;

    if (this.queryString.page || this.queryString.limit) {
      this.totalPages = Math.ceil(
        this.totalResults / (Number(this.queryString.limit) || 10),
      );
    }

    if (this.queryString.page || this.queryString.limit) {
      return {
        results: this.result,
        totalResults: this.totalResults,
        totalPages: this.totalPages || 1,
        limit: Number(this.queryString.limit) || 10,
        page: Number(this.queryString.page) || 1,
      };
    } else {
      return {
        results: this.result,
        totalResults: this.totalResults,
      };
    }
  }
}
