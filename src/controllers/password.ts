import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { changePasswordSchema, emailSchema, passwordSchema } from '@auth/schemes/password';
import { authChannel } from '@auth/server';
import {
  getAuthUserByPasswordToken,
  getUserByEmail,
  getUserByUsername,
  updatePassword,
  updatePasswordToken
} from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@vuphuc47edge/jobber-shared';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(emailSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password forgotPassword() method error');
  }

  const { email } = req.body;

  const existingUser: IAuthDocument = (await getUserByEmail(email)) as IAuthDocument;
  if (!existingUser) {
    throw new BadRequestError('invalid credentials', 'Password forgotPassword() method error');
  }

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  const date: Date = new Date();
  date.setHours(date.getHours() + 1);
  await updatePasswordToken(existingUser.id!, randomCharacters, date);
  const resetLink = `${config.CLIENT_URL}/reset_password?token=${randomCharacters}`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: existingUser.email!,
    resetLink,
    username: existingUser.username!,
    template: 'forgotPassword'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Forgot password message sent to notification success.'
  );

  res.status(StatusCodes.OK).json({ message: 'Password reset email sent.' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(passwordSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password resetPassword() method error');
  }

  const { password, confirmPassword } = req.body;
  const { token } = req.params;

  if (password !== confirmPassword) {
    throw new BadRequestError('Passwords do not match', 'Password resetPassword() method error');
  }

  const existingUser: IAuthDocument = (await getAuthUserByPasswordToken(token)) as IAuthDocument;
  if (!existingUser) {
    throw new BadRequestError('Reset token has expired', 'Password resetPassword() method error');
  }

  const hashedPassword = await AuthModel.prototype.hashPassword(password);
  await updatePassword(existingUser.id!, hashedPassword);
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username!,
    template: 'resetPasswordSuccess'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Reset password message sent to notification success.'
  );

  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(changePasswordSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password changePassword() method error');
  }

  const { newPassword } = req.body;

  const existingUser: IAuthDocument | undefined = await getUserByUsername(`${req.currentUser?.username}`);
  if (!existingUser) {
    throw new BadRequestError('Invalid password', 'Password changePassword() method error');
  }

  const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
  await updatePassword(existingUser.id!, hashedPassword);
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username,
    template: 'resetPasswordSuccess'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Password change success message sent to notification service.'
  );

  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
};
