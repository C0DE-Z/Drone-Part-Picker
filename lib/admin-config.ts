// Admin configuration utility
export const getAdminEmail = (): string => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL environment variable is not set. Admin functionality will be disabled.');
    return '';
  }
  
  return adminEmail;
};

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  
  return email.toLowerCase() === adminEmail.toLowerCase();
};
