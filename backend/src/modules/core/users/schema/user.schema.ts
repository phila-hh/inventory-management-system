import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Schema({ timestamps: true, id: true })
export class User extends mongoose.Document {
  @ApiProperty({ type: String })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ type: String })
  @Prop({ required: true, trim: true, lowercase: true })
  username: string;

  @ApiProperty({ type: String })
  @Prop({ required: false, minlength: 6 })
  password: string;

  @Prop({ default: true })
  canLogin: boolean;

  @ApiProperty({ type: String, enum: UserRole })
  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: true,
  })
  role: UserRole;

  @ApiProperty({ type: Boolean })
  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 }, { unique: true });

UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    const user = this as UserDocument;

    if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8);
    }
    user.canLogin = !!user.password;
  }
  next();
});

UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (!update) return next();


  const plainPassword =
    update.password || (update.$set && update.$set.password);

  if (plainPassword) {
    const hashed = await bcrypt.hash(plainPassword, 8);
    if (update.password) {
      update.password = hashed;
    } else if (update.$set) {
      update.$set.password = hashed;
    }

    const canLogin = !!plainPassword;
    if (update.canLogin !== undefined) {
      update.canLogin = canLogin;
    } else if (update.$set) {
      update.$set.canLogin = canLogin;
    }
  }
  next();
});


UserSchema.methods.isPasswordMatch = async function (
  password: string,
): Promise<boolean> {
  const user = this as UserDocument;
  return bcrypt.compare(password, user.password);
};

UserSchema.statics.isUsernameTaken = async function (
  username: string,
  excludeUserId?: mongoose.Schema.Types.ObjectId,
): Promise<boolean> {
  const user = await this.findOne({
    username,
    _id: { $ne: excludeUserId },
  });
  return !!user;
};
