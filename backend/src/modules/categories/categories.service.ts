import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryModel.findOne({ name: createDto.name }).exec();
    if (existing) {
      throw new BadRequestException(`Category '${createDto.name}' already exists`);
    }

    const newCategory = new this.categoryModel(createDto);
    return newCategory.save();
  }

  async findAll(activeOnly: boolean = false): Promise<Category[]> {
    const query = activeOnly ? { isActive: true } : {};
    return this.categoryModel.find(query).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string): Promise<Category | null> {
    return this.categoryModel.findOne({ name }).exec();
  }

  async update(id: string, updateDto: UpdateCategoryDto): Promise<Category> {
    if (updateDto.name) {
      const existing = await this.categoryModel.findOne({ 
        name: updateDto.name,
        _id: { $ne: id }
      }).exec();
      
      if (existing) {
        throw new BadRequestException(`Category '${updateDto.name}' already exists`);
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async getItemCount(categoryName: string): Promise<number> {
    
    return 0;
  }
}
