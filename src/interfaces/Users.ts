interface User {
  _id: string;
  username: string;
  favouriteRestaurant?: string;
  avatar?: string;
  role: string;
  email: string;
}

interface LoginUser {
  message: string;
  token: string;
  data: User;
}

interface RegisterUser {
  username: string;
  password: string;
  email: string;
}

export type { User, LoginUser, RegisterUser };
