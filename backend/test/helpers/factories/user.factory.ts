import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../../src/modules/core/users/schema/user.schema';

faker.setLocale('en');

export class UserFactory {
  constructor(private userModel: Model<User>) {}

  /**
   * Create a user in the database with default fake data.
   * @param overrides - Optional fields to override default values
   */
  async create(overrides: Partial<User> = {}): Promise<User> {
    const defaultData = {
      name: `${faker.name.firstName()} ${faker.name.lastName()}`,
      // Ensure username is lowercase and unique-ish
      username: faker.internet.userName().toLowerCase() + Date.now(),
      password: 'password123', // Will be hashed by the Schema pre-save hook
      role: UserRole.ADMIN,
      isActive: true,
      canLogin: true,
    };

    const userData = { ...defaultData, ...overrides };

    // We use create() so the pre('save') hooks in your UserSchema fire (hashing password)
    return this.userModel.create(userData);
  }

  /**
   * Create multiple users
   */
  async createMany(count: number, overrides: Partial<User> = {}): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    return users;
  }
}
