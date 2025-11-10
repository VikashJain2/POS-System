class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, populate = []) {
    let query = await this.model.findById(id);
    populate.forEach((field) => {
      query.populate(field);
    });

    return await query.exec();
  }

  async findOne(conditions, populate = []) {
    let query = await this.model.findOne(conditions);
    populate.forEach((field) => {
      query.populate(field);
    });
    return await query.exec();
  }

  async find(
    conditions = {},
    populate = [],
    sort = { createdAt: -1 },
    limit = null
  ) {
    let query = await this.model.find(conditions);
    populate.forEach((field) => {
      query.populate(field);
    });
    query = query.sort(sort);
    if (limit) {
      query = query.limit(limit);
    }
    return await query.exec();
  }

  async update(id, data) {
    return await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async count(conditions = {}) {
    return await this.model.countDocuments(conditions);
  }

  async exists(conditions) {
    const count = await this.model.countDocuments(conditions);
    return count > 0;
  }

  async paginate(
    conditions = {},
    page = 1,
    limit = 10,
    populate = [],
    sort = { createdAt: -1 }
  ) {
    const skip = (page - 1) * limit;

    let query = this.model.find(conditions).skip(skip).limit(limit).sort(sort);

    populate.forEach((field) => {
      query = query.populate(field);
    });
    const [date, total] = await Promise.all([
      query.exec(),
      this.count(conditions),
    ]);

    return {
      date,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default BaseRepository;
