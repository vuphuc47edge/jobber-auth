import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { IAuthBuyerMessageDetails, IAuthDocument, firstLetterUppercase, lowerCase, winstonLogger } from '@vuphuc47edge/jobber-shared';
import { sign } from 'jsonwebtoken';
import { omit } from 'lodash';
import { Model, Op } from 'sequelize';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'AuthServices', 'debug');

export const createAuthUser = async (data: IAuthDocument): Promise<IAuthDocument | undefined> => {
  try {
    const result: Model = await AuthModel.create(data);

    const messageDetails: IAuthBuyerMessageDetails = {
      username: result.dataValues.username!,
      email: result.dataValues.email!,
      profilePicture: result.dataValues.profilePicture!,
      country: result.dataValues.country!,
      createdAt: result.dataValues.createdAt!,
      type: 'auth'
    };

    await publishDirectMessage(
      authChannel,
      'jobber-buyer-update',
      'user-buyer',
      JSON.stringify(messageDetails),
      'Buyer details sent to buyer service.'
    );

    const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;

    return userData;
  } catch (error) {
    log.error(error);
  }
};

export const getAuthUserById = async (authId: number): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: { id: authId },
      attributes: {
        exclude: ['password']
      }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const getUserByUsernameOrEmail = async (username: string, email: string): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: {
        [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
      }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const getUserByUsername = async (username: string): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: { username: firstLetterUppercase(username) }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const getUserByEmail = async (email: string): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: { email: lowerCase(email) }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const getAuthUserByVerificationToken = async (token: string): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: { emailVerificationToken: token },
      attributes: {
        exclude: ['password']
      }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const getAuthUserByPasswordToken = async (token: string): Promise<IAuthDocument | undefined> => {
  try {
    const user: Model = (await AuthModel.findOne({
      where: {
        [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
      }
    })) as Model;

    return user.dataValues;
  } catch (error) {
    log.error(error);
  }
};

export const updateVerifyEmailField = async (authId: number, emailVerified: number, emailVerificationToken: string): Promise<void> => {
  try {
    await AuthModel.update(
      {
        emailVerified,
        emailVerificationToken
      },
      {
        where: { id: authId }
      }
    );
  } catch (error) {
    log.error(error);
  }
};

export const updatePasswordToken = async (authId: number, token: string, tokenExpiration: Date): Promise<void> => {
  try {
    await AuthModel.update(
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      },
      {
        where: { id: authId }
      }
    );
  } catch (error) {
    log.error(error);
  }
};

export const updatePassword = async (authId: number, password: string): Promise<void> => {
  try {
    await AuthModel.update(
      {
        password,
        passwordResetToken: '',
        passwordResetExpires: new Date()
      },
      {
        where: { id: authId }
      }
    );
  } catch (error) {
    log.error(error);
  }
};

export const signToken = (id: number, email: string, username: string): string => {
  return sign({ id, email, username }, config.JWT_TOKEN!);
};
