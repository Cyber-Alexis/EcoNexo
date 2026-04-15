<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mailSubject ?? 'Notificación EcoNexo' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f4f6f9;
            color: #333333;
            padding: 30px 10px;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #2e7d32, #66bb6a);
            border-radius: 12px 12px 0 0;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p {
            color: #c8e6c9;
            font-size: 13px;
            margin-top: 4px;
        }
        .body {
            background-color: #ffffff;
            padding: 36px 40px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #2e7d32;
            margin-bottom: 16px;
        }
        .message {
            font-size: 15px;
            line-height: 1.7;
            color: #444444;
            margin-bottom: 24px;
        }
        .code-box {
            background-color: #f0faf0;
            border: 2px dashed #66bb6a;
            border-radius: 10px;
            text-align: center;
            padding: 20px;
            margin: 24px 0;
        }
        .code-box p {
            font-size: 12px;
            color: #777;
            margin-bottom: 8px;
        }
        .code-box span {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #2e7d32;
        }
        .action-btn {
            display: block;
            width: fit-content;
            margin: 24px auto;
            background: linear-gradient(135deg, #2e7d32, #66bb6a);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .divider {
            border: none;
            border-top: 1px solid #eeeeee;
            margin: 24px 0;
        }
        .footer {
            background-color: #f4f6f9;
            border-radius: 0 0 12px 12px;
            padding: 20px 40px;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            color: #999999;
            line-height: 1.6;
        }
        .footer a {
            color: #2e7d32;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <!-- Header -->
        <div class="header">
            <h1>EcoNexo</h1>
            <p>Plataforma sostenible de negocios</p>
        </div>

        <!-- Body -->
        <div class="body">
            @if (!empty($recipientName))
                <p class="greeting">Hola, {{ $recipientName }}!</p>
            @else
                <p class="greeting">Hola!</p>
            @endif

            <p class="message">{{ $messageBody }}</p>

            @if (!empty($recoveryCode))
                <div class="code-box">
                    <p>Tu código es:</p>
                    <span>{{ $recoveryCode }}</span>
                </div>
            @endif

            @if (!empty($actionUrl) && !empty($actionText))
                <a href="{{ $actionUrl }}" class="action-btn">{{ $actionText }}</a>
            @endif

            <hr class="divider">

            <p style="font-size:13px; color:#888;">
                Si no reconoces esta acción, puedes ignorar este correo con seguridad.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                © {{ date('Y') }} EcoNexo. Todos los derechos reservados.<br>
                Este es un correo automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
