<?php

namespace App\Http\Controllers;

use App\Mail\SendEmail;
use App\Models\Business;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        $maintenanceEnabled = (bool) data_get(
            SystemSetting::query()->where('key', 'maintenance')->first()?->value,
            'enabled',
            false
        );

        if ($maintenanceEnabled && $user && $user->role !== 'admin') {
            return response()->json([
                'message' => 'La plataforma está temporalmente en modo mantenimiento. Vuelve a intentarlo más tarde.',
            ], 503);
        }

        if ($user && $user->status === 'bloqueado') {
            return response()->json([
                'message' => 'Has sido bloqueado por incumplir las normativas',
            ], 403);
        }

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * POST /api/auth/register  (cliente)
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email'     => 'required|email|max:255|unique:users',
            'password'  => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'last_name' => $data['last_name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role'      => 'consumer',
            'status'    => 'activo',
        ]);

        $token = auth('api')->login($user);

        return $this->respondWithToken($token, 201);
    }

    /**
     * POST /api/auth/register-negocio  (propietario de negocio)
     */
    public function registerBusiness(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|email|max:255|unique:users',
            'password'      => 'required|string|min:6',
            'business_name' => 'required|string|max:255',
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'last_name' => $data['last_name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role'      => 'business',
            'status'    => 'activo',
        ]);

        Business::create([
            'user_id' => $user->id,
            'name'    => $data['business_name'],
            'status'  => 'active',
        ]);

        $token = auth('api')->login($user);

        return $this->respondWithToken($token, 201);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    /**
     * GET /api/auth/me
     */
    public function me()
    {
        return response()->json($this->serializeUser(auth('api')->user()));
    }

    /**
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $data['email'])->first();

        // Always respond the same to prevent email enumeration
        if ($user) {
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token'      => Hash::make($code),
                    'created_at' => now(),
                ]
            );

            Mail::to($user->email)->send(new SendEmail(
                mailSubject:   'Recuperación de contraseña – EcoNexo',
                messageBody:   'Hemos recibido una solicitud para restablecer tu contraseña. Usa el código de 6 dígitos que aparece a continuación. Este código expira en 15 minutos.',
                recipientName: $user->name,
                recoveryCode:  $code,
            ));
        }

        return response()->json([
            'message' => 'Si el correo está registrado, recibirás un código de recuperación.',
        ]);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email'                 => 'required|email',
            'code'                  => 'required|string|size:6',
            'password'              => 'required|string|min:6|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Código inválido o expirado.'], 422);
        }

        // 15-minute expiry
        if (now()->diffInMinutes($record->created_at) > 15) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            return response()->json(['message' => 'El código ha expirado. Solicita uno nuevo.'], 422);
        }

        if (!Hash::check($data['code'], $record->token)) {
            return response()->json(['message' => 'El código introducido no es correcto.'], 422);
        }

        User::where('email', $data['email'])->update([
            'password' => Hash::make($data['password']),
        ]);

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        return response()->json(['message' => 'Contraseña restablecida correctamente.']);
    }

    private function respondWithToken(string $token, int $status = 200)
    {
        $user = auth('api')->user();

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user'         => $this->serializeUser($user),
        ], $status);
    }

    private function serializeUser(User $user): array
    {
        $business = $user->businesses()->latest('id')->first();
        $avatar = $user->avatar;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone,
            'address' => $user->address,
            'city' => $user->city,
            'postal_code' => $user->postal_code,
            'business_id' => $business?->id,
            'business_name' => $business?->name,
            'avatar_url' => $avatar?->path,
        ];
    }
}
