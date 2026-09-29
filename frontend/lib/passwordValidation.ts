export const validatePassword = (pass: string) => {
  const minLength = pass.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(pass);
  const hasNumber = /\d/.test(pass);
  return minLength && hasLetter && hasNumber;
};
