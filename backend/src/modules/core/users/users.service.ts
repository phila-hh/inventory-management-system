import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { User, UserRole } from './schema/user.schema';
import UpdateUserDto from './dto/updateUser.dto';
import CreateUserDto from './dto/createUser.dto';

@Injectable()
export default class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(user: CreateUserDto): Promise<User> {
    const userData: Partial<CreateUserDto & { hashedPassword?: string }> = {
      ...user,
    };

    if (user.password) {
      userData.hashedPassword = await bcrypt.hash(user.password, 10);
    }

    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  getByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({
      username,
    });
  }

  getById(id: ObjectId): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role });
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async remove(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return this.userModel.findByIdAndDelete(id);
  }

  getAll(): Promise<User[]> {
    return this.userModel.find();
  }
}
