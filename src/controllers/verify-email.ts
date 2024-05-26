import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@vuphuc47edge/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const update = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  const checkIfUserExist: IAuthDocument = (await getAuthUserByVerificationToken(token)) as IAuthDocument;
  if (!checkIfUserExist) {
    throw new BadRequestError('Verifycation token is either invalid or is already used.', 'VerifyEmail update() method error');
  }

  await updateVerifyEmailField(checkIfUserExist.id!, 1, '');
  const updatedUser = await getAuthUserById(checkIfUserExist.id!);

  res.status(StatusCodes.OK).json({ message: 'Email verify success.', user: updatedUser });
};
