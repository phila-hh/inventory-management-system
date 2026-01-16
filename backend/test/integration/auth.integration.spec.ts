import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import mongoose from 'mongoose';
import AuthService from '../../src/modules/core/auth/auth.service';
import { User, UserSchema, UserRole } from '../../src/modules/core/users/schema/user.schema';
import {
  connectToDatabase,
  closeDatabaseConnection,
  clearDatabase,
} from '../helpers/test-database.helper';
import { UserFactory } from '../helpers/factories/user.factory';

describe('AuthService (Integration)', () => {
  let authService: AuthService;
  let userFactory: UserFactory;
  let module: TestingModule;

  beforeAll(async () => {
    // 1. Connect to In-Memory DB
    await connectToDatabase();

    // 2. Setup the Testing Module
    // We import the real MongooseModule and JwtModule to test integration
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/inventory_test_db'),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // Setup Factory
    const userModel = module.get('UserModel');
    userFactory = new UserFactory(userModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
    await closeDatabaseConnection();
  });

  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      // Create user (password is 'password123' by default in factory)
      const user = await userFactory.create({ username: 'validuser' });

      const result = await authService.login(user, 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw BadRequestException for invalid password', async () => {
      const user = await userFactory.create({ username: 'validuser' });

      // We expect the service to verify the hash comparison
      await expect(authService.login(user, 'wrongpassword'))
        .rejects
        .toThrow('Username or Password is incorrect');
    });
  });

  describe('checkToken', () => {
    it('should return the user if the ID in payload exists', async () => {
      const user = await userFactory.create();

      const payload = { id: user._id.toString() };
      const foundUser = await authService.checkToken(payload);

      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe(user.username);
    });

    it('should throw NotFoundException if user has been deleted', async () => {
      const id = new mongoose.Types.ObjectId();

      await expect(authService.checkToken({ id }))
        .rejects
        .toThrow('The user does not exist');
    });
  });
});
