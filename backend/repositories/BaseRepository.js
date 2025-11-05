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

  async find(conditions = {}, populate = [], sort = { createdAt: -1 }) {
    let query = await this.model.find(conditions);
    populate.forEach((field) => {
      query.populate(field);
    });
    return await query.sort(sort).exec();
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
}

export default BaseRepository;
