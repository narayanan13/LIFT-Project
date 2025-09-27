# Alumni Network - Financial Transparency Platform

A secure, invite-only platform for alumni contribution and expense tracking with complete financial transparency.

## 🚀 Features

### ✅ **Authentication & Authorization**
- Secure login system with role-based access (Admin/Alumni)
- Demo accounts for testing
- Protected routes and admin-only sections
- **Invitation-based registration** with 7-day expiry

### ✅ **Financial Management**
- **Contributions Tracking**: Record and manage alumni contributions
- **Expense Management**: Track all fund expenses with categories
- **Real-time Budget Overview**: Live calculations of remaining funds
- **Financial Reports**: Comprehensive analytics and insights

### ✅ **User Management**
- **Invitation System**: Send email invitations to new alumni
- **User Roles**: Admin and Alumni member roles
- **Profile Management**: Edit user information

### ✅ **Email Integration**
- **FREE Email Service**: Resend integration (3,000 emails/month free)
- **Professional Templates**: Beautiful responsive HTML email templates
- **Invitation Links**: Secure token-based invitation system (7-day expiry)
- **Email Status Tracking**: Track sent, pending, and expired invitations
- **Development Mode**: Console logging for testing

### ✅ **Data Persistence**
- **Real-time Updates**: All forms save data and update UI immediately
- **Cross-page Consistency**: Data synced across all pages
- **Local State Management**: Efficient data context system

## 🛠️ **Technology Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **Authentication**: Supabase Auth with Email/Password
- **Email**: Resend (FREE - 3,000 emails/month)
- **State Management**: React Context API
- **Routing**: React Router DOM

## 📧 **FREE Email Service Setup (Resend)**

### **Why Resend?**
- ✅ **3,000 FREE emails per month** (perfect for alumni networks)
- ✅ **Developer-friendly** with excellent documentation
- ✅ **High deliverability** rates
- ✅ **Simple setup** - just one API key needed
- ✅ **Professional templates** included

### **🎉 READY TO ACTIVATE! You have your API key!**

#### **Step 1: Add API Key to Supabase (REQUIRED)**
1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** → **Edge Functions** → **Environment Variables**
3. Click **"Add new variable"**
4. Add:
   ```
   Name: RESEND_API_KEY
   Value: re_G8yqgRYd_B2BnSKyBvA4PnQFz3HLejhG9
   ```
5. Click **"Save"**

#### **Step 2: Deploy Edge Function (if needed)**
The edge function should already be deployed. If not, it will auto-deploy when you first use it.

#### **Step 3: Test Real Email Sending**
1. **Send an invitation** to `nk13.dev@gmail.com`
2. **Check the actual email inbox** - you should receive a beautiful professional email!
3. **No more console logging** - real emails will be sent

### **🚀 Production Mode (ACTIVE after adding API key)**
- Real emails sent to recipients
- Professional HTML templates
- Delivery tracking and status
- Beautiful responsive design
- **7-day invitation expiry** for security

### **Current Implementation Status**

#### **✅ Development Mode (Current)**
- Emails are logged to browser console
- Perfect for testing and development
- Shows all email details including invitation links

#### **🎯 Production Mode (Ready to activate)**
- Just add your Resend API key to Supabase environment variables
- Real emails sent to recipients
- Professional HTML templates
- Delivery tracking and status

### **Testing the Email System**

**After adding the API key to Supabase:**

1. **Send an invitation** to `nk13.dev@gmail.com`
2. **Check the actual email inbox** (not console anymore)
3. **You'll receive**:
   - Beautiful professional HTML email
   - Secure invitation link (7-day expiry)
   - Personal message (if provided)
   - Responsive design that works on all devices

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- Supabase account (free tier works)

### **Installation**

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd alumni-tracking-platform
npm install
```

2. **Environment Setup**:
```bash
# Create .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Configure Authentication**:
   - Set up Supabase project
   - Add Resend API key to Supabase environment variables

4. **Start development server**:
```bash
npm run dev
```

### **Demo Accounts**

#### **Admin Account**
- **Email**: `admin@alumni.org`
- **Password**: `password`
- **Access**: Full admin privileges

#### **Alumni Account**
- **Email**: `user@alumni.org`
- **Password**: `password`
- **Access**: Alumni member features

## 📊 **Application Structure**

### **Admin Features**
- ✅ **Dashboard**: Overview with quick actions
- ✅ **Manage Contributions**: Add/edit/delete contributions
- ✅ **Manage Expenses**: Add/edit/delete expenses
- ✅ **Manage Users**: Send invitations (7-day expiry), edit users
- ✅ **Reports**: Financial analytics and insights

### **Alumni Features**
- ✅ **Dashboard**: Personal overview
- ✅ **View Expenses**: Transparent expense tracking
- ✅ **My Contributions**: Personal contribution history

### **Authentication Flow**
- ✅ **Email/Password**: Traditional login
- ✅ **Invitation System**: Secure 7-day token-based registration
- ✅ **Role-based Access**: Admin vs Alumni permissions

## 🔧 **Key Components**

### **Data Management**
- `src/contexts/DataContext.tsx`: Centralized data management
- `src/contexts/AuthContext.tsx`: Authentication state
- `src/services/emailService.ts`: Email service integration

### **Pages**
- `src/pages/Dashboard.tsx`: Main dashboard with quick actions
- `src/pages/AdminUsers.tsx`: User management and invitations
- `src/pages/InvitationSignup.tsx`: New user registration via invitation
- `src/pages/AuthCallback.tsx`: Auth callback handler
- `src/pages/Expenses.tsx`: Expense tracking and viewing
- `src/pages/MyContributions.tsx`: Personal contribution history

### **Email System**
- `supabase/functions/send-invitation/index.ts`: Email sending function
- Professional responsive HTML email templates
- Token-based invitation system with 7-day expiry

## 💰 **Email Service Comparison**

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Resend** ⭐ | 3,000/month | Easy | **Recommended** |
| SendGrid | 100/day | Medium | High volume |
| Mailgun | 5,000/month | Medium | Developers |
| AWS SES | 62,000/month | Hard | Enterprise |

## 🎯 **Production Deployment**

### **Database Setup**
1. Set up Supabase project
2. Configure authentication
3. Set up database tables
4. Deploy edge functions

### **Authentication Setup**
1. Set up user roles and permissions
2. Test email/password authentication

### **Email Service Activation**
1. **✅ DONE: Get Resend API key** (you have: re_G8yqgRYd_B2BnSKyBvA4PnQFz3HLejhG9)
2. **🎯 NEXT: Add to Supabase environment variables**:
   ```
   RESEND_API_KEY=re_G8yqgRYd_B2BnSKyBvA4PnQFz3HLejhG9
   ```
3. **Optional: Verify your domain** (for custom from address)
4. **Test email delivery** to nk13.dev@gmail.com

### **Frontend Deployment**
1. Build the application: `npm run build`
2. Deploy to your preferred hosting (Vercel, Netlify, etc.)
3. Configure environment variables
4. Update redirect URLs for production domain

## 📈 **Features Roadmap**

### **Completed ✅**
- Authentication system with email/password
- Financial tracking (contributions/expenses)
- User management with 7-day invitations
- FREE email service integration (Resend)
- Data persistence and real-time updates
- Professional responsive UI/UX design
- Development and production email modes
- Invitation-based user registration

### **Future Enhancements**
- Database integration with Supabase (replace mock data)
- File upload for receipts/documents
- Advanced reporting and analytics
- Mobile app development
- Notification system
- Audit trail for all transactions
- Multi-language support

## 🔒 **Security Features**

- **Token-based invitations** with 7-day expiry
- **Role-based access control** (Admin/Alumni)
- **Secure email templates** with anti-phishing measures
- **Environment variable protection** for API keys
- **CORS protection** on all endpoints

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including email functionality)
5. Submit a pull request

## 📞 **Support**

- **Email Issues**: Check browser console for detailed logs
- **API Problems**: Verify Supabase and Resend API keys
- **General Help**: Create an issue in the repository

## 📄 **License**

This project is licensed under the MIT License.

---

**🎓 Built with ❤️ for alumni communities worldwide**

**🔐 Powered by Supabase Auth**
**📧 Powered by Resend - The email API for developers**