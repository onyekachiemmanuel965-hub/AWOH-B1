import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { SafeHttpExceptionFilter } from './safe-http-exception.filter';

describe('SafeHttpExceptionFilter', () => {
  function run(exception: unknown, nodeEnv?: string) {
    const prev = process.env.NODE_ENV;
    if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status };
    const host = {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => ({ method: 'GET', url: '/api/v1/test' }),
      }),
    };
    const filter = new SafeHttpExceptionFilter();
    filter.catch(exception, host as never);
    if (nodeEnv !== undefined) process.env.NODE_ENV = prev;
    return { status, json };
  }

  it('returns HttpException message for 4xx', () => {
    const { status, json } = run(new BadRequestException('Invalid quantity.'));
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid quantity.',
      }),
    );
  });

  it('hides internal details for 500 in production', () => {
    const { status, json } = run(new Error('PrismaClientKnownRequestError at C:\\secret\\path'), 'production');
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0] as { message: string };
    expect(body.message).toBe('An unexpected error occurred.');
    expect(JSON.stringify(body)).not.toContain('Prisma');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('maps rate-limit HttpException to 429', () => {
    const { status, json } = run(
      new HttpException('Too many attempts.', HttpStatus.TOO_MANY_REQUESTS),
    );
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 429 }),
    );
  });
});
