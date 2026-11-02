/**
 * Testing only. When TEST_LOGIN_MODE="true", any email + password logs in
 * (unknown emails get a new account). Server-side only: never read this in a
 * client component; pass it down as a prop instead.
 */
export const testLoginMode = process.env.TEST_LOGIN_MODE === "true";
