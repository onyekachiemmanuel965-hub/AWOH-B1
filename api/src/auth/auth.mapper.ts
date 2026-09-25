export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
};

export function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: { code: string };
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.code,
    status: user.status,
  };
}
