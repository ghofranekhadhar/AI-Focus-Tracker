import { randomBytes } from "crypto";

export function generateInvitationToken() {
  return randomBytes(32).toString("hex"); // token aléatoire 64 caractères
}
