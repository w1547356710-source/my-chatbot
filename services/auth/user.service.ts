import { userRepo } from "./user.repo";

export async function createUser(email: string, password: string) {
  return userRepo.createUser(email, password);
}
