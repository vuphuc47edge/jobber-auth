import { IAuthDocument, IAuthPayload } from '@vuphuc47edge/jobber-shared';
import { Response } from 'express';

export const authMockRequest = (sessionData: IJWT, body: IAuthMock, currentUser?: IAuthPayload | null, params?: unknown) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const authMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IJWT {
  jwt?: string;
}

export interface IAuthMock {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
  createdAt?: Date | string;
}

export const authUserPayload: IAuthPayload = {
  id: 1,
  username: 'test1',
  email: 'test1@gmail.com',
  iat: 123123123
};

export const authMock: IAuthDocument = {
  id: 1,
  profilePublicId: '123123123',
  username: 'test1',
  email: 'test1@gmail.com',
  country: 'VN',
  profilePicture: '',
  emailVerifified: 1,
  createdAt: '2024-5-26T07:42:24.413Z',
  comparePassword: () => {},
  hashPassword: () => false
} as unknown as IAuthDocument;
