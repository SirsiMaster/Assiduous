/**
 * Advanced Query Builder for JSON/MongoDB compatible queries
 */
export class QueryBuilder {
  constructor() {
    this.query = {};
    this.sortOptions = {};
    this.limitValue = null;
    this.skipValue = null;
    this.populateFields = [];
  }

  // Comparison Operators
  equals(field, value) {
    this.query[field] = value;
    return this;
  }

  notEquals(field, value) {
    this.query[field] = { $ne: value };
    return this;
  }

  greaterThan(field, value) {
    this.query[field] = { $gt: value };
    return this;
  }

  lessThan(field, value) {
    this.query[field] = { $lt: value };
    return this;
  }

  greaterThanOrEqual(field, value) {
    this.query[field] = { $gte: value };
    return this;
  }

  lessThanOrEqual(field, value) {
    this.query[field] = { $lte: value };
    return this;
  }

  in(field, values) {
    this.query[field] = { $in: values };
    return this;
  }

  notIn(field, values) {
    this.query[field] = { $nin: values };
    return this;
  }

  // Logical Operators
  and(queries) {
    this.query.$and = queries.map(q => q.build().query);
    return this;
  }

  or(queries) {
    this.query.$or = queries.map(q => q.build().query);
    return this;
  }

  not(field, value) {
    this.query[field] = { $not: value };
    return this;
  }

  // Array Operators
  exists(field) {
    this.query[field] = { $exists: true };
    return this;
  }

  notExists(field) {
    this.query[field] = { $exists: false };
    return this;
  }

  contains(field, value) {
    this.query[field] = { $elemMatch: value };
    return this;
  }

  // Text Search
  search(text) {
    this.query.$text = { $search: text };
    return this;
  }

  // Regular Expression
  regex(field, pattern, options = 'i') {
    this.query[field] = { $regex: pattern, $options: options };
    return this;
  }

  // Geospatial
  near(field, coordinates, maxDistance) {
    this.query[field] = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    };
    return this;
  }

  within(field, coordinates) {
    this.query[field] = {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      }
    };
    return this;
  }

  // Pagination and Sorting
  sort(field, order = 'asc') {
    this.sortOptions[field] = order === 'asc' ? 1 : -1;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  skip(value) {
    this.skipValue = value;
    return this;
  }

  // Population/Joins
  populate(field) {
    this.populateFields.push(field);
    return this;
  }

  // Build the final query
  build() {
    return {
      query: this.query,
      options: {
        sort: this.sortOptions,
        limit: this.limitValue,
        skip: this.skipValue,
        populate: this.populateFields
      }
    };
  }

  // Static helper methods
  static price(min, max) {
    return new QueryBuilder()
      .greaterThanOrEqual('basic.price', min)
      .lessThanOrEqual('basic.price', max);
  }

  static location(latitude, longitude, radius) {
    return new QueryBuilder()
      .near('location', [longitude, latitude], radius);
  }

  static propertyType(...types) {
    return new QueryBuilder()
      .in('basic.type', types);
  }

  static amenities(...amenities) {
    return new QueryBuilder()
      .contains('details.amenities', { $all: amenities });
  }

  static recent(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return new QueryBuilder()
      .greaterThanOrEqual('metadata.createdAt', date.toISOString());
  }
}
