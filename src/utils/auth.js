import bcrypt from 'bcrypt';

// Hàm băm mật khẩu
export const hashPassword = async (password) => {
  const saltRounds = 10; // Số vòng băm
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Hàm so sánh mật khẩu
export const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};