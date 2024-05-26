import { AuthModel } from '@auth/models/auth.schema';
import { loginSchema } from '@auth/schemes/signin';
import { getUserByEmail, getUserByUsername, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, isEmail } from '@vuphuc47edge/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { omit } from 'lodash';

export const read = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(loginSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
  }

  const { username, password } = req.body;
  const isValidEmail = isEmail(username);

  const existingUser: IAuthDocument | undefined = !isValidEmail ? await getUserByUsername(username) : await getUserByEmail(username);
  if (!existingUser) {
    throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
  }

  const passwordMatch: boolean = await AuthModel.prototype.comparePassword(password, `${existingUser.password}`);
  if (!passwordMatch) {
    throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
  }

  const userJWT: string = signToken(existingUser.id!, existingUser.email!, existingUser.username!);
  const userData: IAuthDocument = omit(existingUser, ['password']);

  res.status(StatusCodes.OK).json({ message: 'User logged in success.', user: userData, token: userJWT });
};
