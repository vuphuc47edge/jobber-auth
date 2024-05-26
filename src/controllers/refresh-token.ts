import { getUserByUsername, signToken } from '@auth/services/auth.service';
import { IAuthDocument } from '@vuphuc47edge/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const token = async (req: Request, res: Response): Promise<void> => {
  const existingUser: IAuthDocument = (await getUserByUsername(req.params.username)) as IAuthDocument;
  const userJWT: string = signToken(existingUser.id!, existingUser.email!, existingUser?.username!);
  res.status(StatusCodes.OK).json({ message: 'Refresh token', user: existingUser, token: userJWT });
};
