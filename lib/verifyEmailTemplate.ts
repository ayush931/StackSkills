const verifyEmailTemplate = (name: string, verifyCode: number) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification - Stack Skills</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
      .header {
        background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
        color: white;
        text-align: center;
        padding: 40px 20px;
        position: relative;
      }
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        position: relative;
        z-index: 1;
      }
      .logo {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 10px;
        position: relative;
        z-index: 1;
      }
      .content {
        padding: 40px 30px;
        text-align: center;
      }
      .greeting {
        font-size: 18px;
        color: #2d2d2d;
        margin-bottom: 20px;
        font-weight: 600;
      }
      .content p {
        font-size: 16px;
        color: #555;
        margin: 15px 0;
      }
      .otp-section {
        margin: 30px 0;
        padding: 25px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 12px;
        border: 2px solid #ff6b35;
      }
      .otp-label {
        color: #ff6b35;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .otp {
        font-size: 36px;
        font-weight: 800;
        color: #fff;
        font-family: 'Courier New', monospace;
        letter-spacing: 8px;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .highlight-text {
        color: #ff6b35;
        font-weight: 600;
      }
      .info-box {
        background: #f8f9fa;
        border-left: 4px solid #ff6b35;
        padding: 20px;
        margin: 25px 0;
        border-radius: 8px;
        text-align: left;
      }
      .info-box h3 {
        color: #2d2d2d;
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: 600;
      }
      .info-box p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }
      .footer {
        background: #1a1a1a;
        color: #ccc;
        text-align: center;
        padding: 30px 20px;
        font-size: 14px;
      }
      .footer-brand {
        color: #ff6b35;
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 10px;
      }
      .footer p {
        margin: 8px 0;
      }
      .security-note {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
        font-size: 14px;
        color: #856404;
      }
      .icon {
        display: inline-block;
        width: 20px;
        height: 20px;
        margin-right: 8px;
        vertical-align: middle;
      }
      
      @media (max-width: 600px) {
        .container {
          margin: 20px 10px;
        }
        .content {
          padding: 30px 20px;
        }
        .header {
          padding: 30px 20px;
        }
        .otp {
          font-size: 28px;
          letter-spacing: 4px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">📚 Stack Skills</div>
        <h1>Verify Your Email Address</h1>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${name}! 👋</div>
        
        <p>Welcome to <strong>Stack Skills</strong> - your gateway to mastering new technologies and advancing your career!</p>
        
        <p>To complete your registration and start your learning journey, please verify your email address using the code below:</p>
        
        <div class="otp-section">
          <div class="otp-label">Verification Code</div>
          <div class="otp">${verifyCode}</div>
        </div>
        
        <div class="info-box">
          <h3>🔒 Security Information</h3>
          <p>• This code will expire in <span class="highlight-text">10 minutes</span></p>
          <p>• Use this code only on the Stack Skills platform</p>
          <p>• Never share this code with anyone</p>
        </div>
        
        <p>Once verified, you'll have access to:</p>
        <p>✅ <strong>Premium courses</strong> from industry experts<br>
        ✅ <strong>Interactive coding challenges</strong> and projects<br>
        ✅ <strong>Certificate programs</strong> to showcase your skills<br>
        ✅ <strong>Career guidance</strong> and mentorship opportunities</p>
        
        <div class="security-note">
          <strong>⚠️ Didn't create an account?</strong> If you didn't sign up for Stack Skills, you can safely ignore this email. Your email address will not be added to our platform.
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-brand">Stack Skills</div>
        <p>&copy; 2025 Stack Skills. All rights reserved.</p>
        <p>Empowering developers, one skill at a time.</p>
        <p style="margin-top: 15px; font-size: 12px; color: #999;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  </body>
</html>`;
};

export default verifyEmailTemplate;
