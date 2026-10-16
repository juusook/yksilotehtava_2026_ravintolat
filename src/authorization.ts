import {fetchData} from './functions';
import type {LoginUser, RegisterUser, User} from './interfaces/Users';
import {apiUrl} from './variables';

// kirjautuminen
export const login = async (username: string, password: string): Promise<LoginUser> => {
  const options: RequestInit = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password}),
  };
  return await fetchData<LoginUser>(`${apiUrl}/auth/login`, options);
};

// Rekisteröityminen
export const register = async (userData: RegisterUser): Promise<{message: string; data: User}> => {
  const options: RequestInit = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userData),
  };
  return await fetchData(`${apiUrl}/users`, options);
};

// Käyttäjän hakeminen tokenilla
export const getUserData = async (token: string): Promise<User> => {
  const options: RequestInit = {
    headers: {Authorization: `Bearer ${token}`},
  };
  return await fetchData<User>(`${apiUrl}/users/token`, options);
};
