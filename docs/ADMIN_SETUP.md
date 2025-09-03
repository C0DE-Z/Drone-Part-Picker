# Admin Setup Guide

## Setting Up Admin Access

To configure admin access for your DronePartPicker application:

### 1. Environment Configuration

Set the `ADMIN_EMAIL` environment variable in your `.env` file:

```env
ADMIN_EMAIL="your_admin_email@example.com"
```

Replace `your_admin_email@example.com` with the actual email address of the user who should have admin privileges.

### 2. Accessing Admin Panel

1. **Sign in** with the email address specified in `ADMIN_EMAIL`
2. **Look for the red "Admin" button** in the top navigation bar
3. **Click the Admin button** to access the admin dashboard

### 3. Admin Features

#### Content Management
- **View all posts**: See all builds, custom parts, and comments
- **Delete content**: Remove inappropriate or spam content with reason tracking
- **Bulk operations**: Manage multiple items efficiently

#### User Management
- **View users**: See all registered users with activity statistics
- **User analytics**: Track user engagement and activity levels
- **Role management**: (Future feature when database migration is complete)

### 4. Security Features

- ✅ **Environment-based configuration**: Admin access controlled via secure environment variables
- ✅ **Server-side validation**: Admin status checked on the server for security
- ✅ **Rate limiting**: Admin actions are rate-limited to prevent abuse
- ✅ **Audit logging**: All admin actions are logged for accountability
- ✅ **Input validation**: All admin inputs are validated and sanitized

### 5. Making Changes

To change the admin user:

1. Update the `ADMIN_EMAIL` in your `.env` file
2. Restart your application
3. The new email will automatically have admin access

### 6. Multiple Admins (Future)

Currently, only one admin email is supported. To support multiple admins:

1. Complete the database migration to add the `role` field to the User model
2. Use Prisma Studio or direct database access to set user roles
3. Update the admin checking logic to use database roles instead of environment variables

### 7. Security Best Practices

- ✅ Keep your `.env` file secure and never commit it to version control
- ✅ Use a strong, unique email address for admin access
- ✅ Regularly review admin actions in the logs
- ✅ Consider implementing 2FA for admin accounts (future enhancement)

### 8. Troubleshooting

**Admin button not showing?**
- Check that `ADMIN_EMAIL` is set correctly in `.env`
- Verify you're signed in with the exact email address
- Restart the application after changing environment variables

**Access denied error?**
- Ensure the email in your session matches `ADMIN_EMAIL` exactly (case-sensitive)
- Check that the environment variable is properly loaded

**Admin panel not loading?**
- Check browser console for JavaScript errors
- Verify that all admin API endpoints are working
- Check server logs for any backend errors
