import { sequelize } from '@auth/database';
import { IAuthDocument } from '@vuphuc47edge/jobber-shared';
import { compare, hash } from 'bcryptjs';
import { DataTypes, Model, ModelDefined, Optional } from 'sequelize';

const SALT_ROUND = 10;

interface AuthModelInstanceMethod extends Model {
  prototype: {
    comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
    hashPassword: (password: string) => Promise<string>;
  };
}

type AuthUserCreationAttributes = Optional<IAuthDocument, 'id' | 'createdAt' | 'passwordResetToken' | 'passwordResetExpires'>;

export const AuthModel: ModelDefined<IAuthDocument, AuthUserCreationAttributes> & AuthModelInstanceMethod = sequelize.define(
  'auths',
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePublicId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    },
    passwordResetToken: { type: DataTypes.STRING, allowNull: true },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['username']
      },
      {
        unique: true,
        fields: ['emailVerificationToken']
      }
    ]
  }
) as ModelDefined<IAuthDocument, AuthUserCreationAttributes> & AuthModelInstanceMethod;

AuthModel.addHook('beforeCreate', async (auth: Model) => {
  const hashedPassword: string = await hash(auth.dataValues.password, SALT_ROUND);
  auth.dataValues.password = hashedPassword;
});

AuthModel.prototype.comparePassword = async function (password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
};

AuthModel.prototype.hashPassword = async function (password: string): Promise<string> {
  return hash(password, SALT_ROUND);
};

AuthModel.sync({});
