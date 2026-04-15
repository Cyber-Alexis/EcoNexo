<?php

namespace App\Http\Controllers;

use App\Mail\SendEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailController extends Controller
{
    /**
     * POST /api/admin/send-email
     *
     * Envía un correo personalizado a uno o varios destinatarios.
     *
     * Body JSON:
     * {
     *   "to":            "user@example.com"  | ["a@x.com", "b@x.com"],
     *   "subject":       "Asunto del mensaje",
     *   "message":       "Cuerpo del mensaje",
     *   "recipient_name": "Nombre del destinatario (opcional)",
     *   "recovery_code": "123456 (opcional)",
     *   "action_url":    "https://... (opcional)",
     *   "action_text":   "Texto del botón (opcional)"
     * }
     */
    public function send(Request $request)
    {
        $data = $request->validate([
            'to'             => 'required',
            'to.*'           => 'email',
            'subject'        => 'required|string|max:255',
            'message'        => 'required|string|max:5000',
            'recipient_name' => 'nullable|string|max:255',
            'recovery_code'  => 'nullable|string|max:64',
            'action_url'     => 'nullable|url|max:2048',
            'action_text'    => 'nullable|string|max:100',
        ]);

        // Aceptar string único o array de destinatarios
        $recipients = is_array($data['to']) ? $data['to'] : [$data['to']];

        // Validar cada dirección cuando se pasó como string
        foreach ($recipients as $email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'message' => "Dirección de correo no válida: {$email}",
                ], 422);
            }
        }

        $mailable = new SendEmail(
            mailSubject:   $data['subject'],
            messageBody:   $data['message'],
            recipientName: $data['recipient_name'] ?? null,
            recoveryCode:  $data['recovery_code'] ?? null,
            actionUrl:     $data['action_url'] ?? null,
            actionText:    $data['action_text'] ?? null,
        );

        Mail::to($recipients)->send($mailable);

        return response()->json([
            'message'    => 'Correo enviado correctamente.',
            'recipients' => $recipients,
        ]);
    }
}
