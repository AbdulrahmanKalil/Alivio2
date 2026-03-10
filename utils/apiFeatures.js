class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(allowedFields = []) {
    const excludedFields = ["page", "sort", "limit", "fields", "search"];

    const queryObj = allowedFields.length
      ? allowedFields.reduce((acc, field) => {
          if (this.queryString[field] !== undefined) {
            acc[field] = this.queryString[field];
          }
          return acc;
        }, {})
      : { ...this.queryString };

    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");

      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Math.max(this.queryString.page * 1 || 1, 1);

    const MAX_LIMIT = 20;

    const limit = Math.min(this.queryString.limit * 1 || 10, MAX_LIMIT);

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search(field = "displayName") {
    if (this.queryString.search) {
      const escaped = this.queryString.search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      this.query = this.query.find({
        [field]: { $regex: escaped, $options: "i" },
      });
    }

    return this;
  }
}

module.exports = APIFeatures;
