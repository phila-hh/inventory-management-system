import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import mongoose from 'mongoose';
import AppModule from '../../src/modules/app/app.module';
import {
  connectToDatabase,
  closeDatabaseConnection,
  clearDatabase,
} from '../helpers/test-database.helper';
import { UserFactory } from '../helpers/factories/user.factory';
import AllExceptionsFilter from '../../src/filters/allExceptions.filter';
import { User, UserRole } from '../../src/modules/core/users/schema/user.schema';
import SignUpDto from '../../src/modules/core/auth/dto/signUp.dto';
import SignInDto from '../../src/modules/core/auth/dto/signIn.dto';
import { UpdatePasswordDto } from '../../src/modules/core/auth/dto/signIn.dto';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let userFactory: UserFactory;

  beforeAll(async () => {
    // 1. Connect to the In-Memory DB via our helper
    await connectToDatabase();

    process.env.JWT_SECRET = 'test-secret'; // Ensure secret is set for JWT signing

    // 3. Compile the module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 4. Apply Global Pipes and Filters (Matching main.ts)
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();

    // 5. Initialize Factory with the User Model
    // We get the model from the module to ensure it shares the connection
    const userModel = moduleFixture.get('UserModel');
    userFactory = new UserFactory(userModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabaseConnection();
  });

  describe('POST /auth/sign-up', () => {
    const signUpDto: SignUpDto = {
      name: 'John Doe',
      username: 'johndoe',
      password: 'password123',
      role: UserRole.STAFF,
      phoneNumber: '+251911223344',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with 400 if password is too short', async () => {
      const invalidDto = { ...signUpDto, password: '123' }; // Min length is 6

      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(invalidDto)
        .expect(400);
    });

    it('should fail if username is already taken', async () => {
      // Create user first
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpDto);

      // Try creating again - Expect 409 Conflict
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto)
        .expect(409);
    });
});

  describe('POST /auth/sign-in', () => {
    it('should authenticate a user and return a JWT token', async () => {
      // 1. Create a user via Factory (bypassing the API for speed)
      const user = await userFactory.create({
        username: 'testuser',
        password: 'password123',
      });

      const signInDto: SignInDto = {
        username: user.username,
        password: 'password123', // Factory sets this as raw password before hash
      };

      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with 400 if password is wrong', async () => {
      const user = await userFactory.create({
        username: 'testuser2',
        password: 'password123',
      });

      const signInDto: SignInDto = {
        username: user.username,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto)
        .expect(400);
    });

    it('should fail with 404 if user does not exist', async () => {
      const signInDto: SignInDto = {
        username: 'ghost',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto)
        .expect(404);
    });
  });

  describe('GET /auth/check-token', () => {
    it('should return user profile if token is valid', async () => {
      // 1. Login to get token
      const user = await userFactory.create({ username: 'authuser' });
      const loginRes = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ username: 'authuser', password: 'password123' });

      const token = loginRes.body.accessToken;

      // 2. Check Token
      const response = await request(app.getHttpServer())
        .get('/auth/check-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'authuser');
      expect(response.body).not.toHaveProperty('password'); // Should be excluded
    });

    it('should return 401 if no token provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/check-token')
        .expect(401);
    });
  });

  describe('PATCH /auth/change-password', () => {
    it('should allow user to change password', async () => {
      const user = await userFactory.create({ username: 'pwduser', password: 'oldPassword123' });

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ username: 'pwduser', password: 'oldPassword123' });
      const token = loginRes.body.accessToken;

      const dto: UpdatePasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(dto)
        .expect(200);

      // Verify new login works
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ username: 'pwduser', password: 'newPassword456' })
        .expect(200);
    });
  });
});
