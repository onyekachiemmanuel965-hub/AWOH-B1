export class JwtService {
  signAsync() {
    return Promise.resolve('token');
  }
  verify() {
    return {};
  }
}

export const JwtModule = {
  register: () => ({}),
  registerAsync: () => ({
    module: class {},
    providers: [],
    exports: [],
  }),
};
