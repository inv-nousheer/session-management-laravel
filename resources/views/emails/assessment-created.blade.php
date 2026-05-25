<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Assessment Created</title>
</head>
<body style="margin: 0; padding: 0; background: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f1f5f9; margin: 0; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);">
                    <tr>
                        <td style="padding: 0;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 48%, #f5576c 100%); padding: 32px 36px;">
                                <p style="margin: 0 0 10px; color: rgba(255, 255, 255, 0.78); font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
                                    Session Management
                                </p>
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; line-height: 1.25; font-weight: 800;">
                                    New Assessment Created
                                </h1>
                                <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.88); font-size: 15px; line-height: 1.6;">
                                    A new assessment has been added to your session.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 34px 36px 12px;">
                            <p style="margin: 0 0 18px; color: #334155; font-size: 16px; line-height: 1.7;">
                                Hi {{ $recipientName }},
                            </p>
                            <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.7;">
                                A new assessment has been created. Please review the details below and log in to the system for any supporting files or additional instructions.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Session</p>
                                        <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">{{ $sessionTitle }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Assessment</p>
                                        <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">{{ $assessmentName }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Description</p>
                                        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">{{ $description }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 18px 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="50%" style="padding-right: 10px;">
                                                    <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Start Time</p>
                                                    <p style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 700;">{{ $startDateTime }}</p>
                                                </td>
                                                <td width="50%" style="padding-left: 10px;">
                                                    <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">End Time</p>
                                                    <p style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 700;">{{ $endDateTime }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="padding: 28px 0 18px; text-align: center;">
                                <a href="{{ $appUrl }}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #f5576c 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 999px; box-shadow: 0 12px 24px rgba(102, 126, 234, 0.25);">
                                    View Assessment
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #0f172a; padding: 24px 36px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                                This email was sent by the Session Management system.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                                Please do not reply directly to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
