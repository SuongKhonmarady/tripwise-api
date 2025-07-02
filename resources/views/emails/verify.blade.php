<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Your Email - TripWise</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .divider {
            margin: 30px 0;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧳 TripWise</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello {{ $user->name }}! 👋
            </div>
            
            <div class="message">
                Welcome to TripWise! We're excited to have you join our community of travelers.
                
                <br><br>
                
                To get started and access all features, please verify your email address by clicking the button below:
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $verificationUrl }}" class="button">
                    Verify Email Address
                </a>
            </div>
            
            <div class="divider"></div>
            
            <div class="message">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <a href="{{ $verificationUrl }}" style="color: #3b82f6; word-break: break-all;">{{ $verificationUrl }}</a>
            </div>
            
            <div class="message">
                This verification link will expire in 24 hours for security reasons.
            </div>
        </div>
        
        <div class="footer">
            <p>
                If you didn't create an account with TripWise, you can safely ignore this email.
            </p>
            <p>
                © {{ date('Y') }} TripWise. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
