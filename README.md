# Stack Skills - Learning Platform

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

- Node.js 18.17.0 or later
- PostgreSQL database
- SMTP email service (Gmail recommended)

## Setup Instructions

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up your environment variables:**

```bash
cp .env.example .env
```

3. **Configure your `.env` file:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stackskills"
JWT_TOKEN="your-super-secret-jwt-token-here"
JWT_EXPIRY=604800
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

4. **Set up the database:**

```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Troubleshooting

### API Not Responding

If your API routes are not responding, check:

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Verify all required env vars are set
3. **SMTP Configuration**: Check email credentials for Gmail App Password
4. **Port Conflicts**: Ensure port 3000 is available
5. **Prisma Client**: Run `npx prisma generate` after schema changes

### Common Issues

- **CORS Issues**: Check if requests are being blocked
- **Database Errors**: Verify DATABASE_URL format
- **Email Sending**: Ensure SMTP credentials are correct
- **JWT Errors**: Check JWT_TOKEN is set

### API Endpoints

- `POST /api/auth/register` - User registration
- Add other endpoints as they're implemented

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
