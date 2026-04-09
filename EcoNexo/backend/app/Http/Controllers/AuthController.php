<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        return response()->json(auth('api')->user());
    }

    private function respondWithToken(string $token, int $status = 200)
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user'         => auth('api')->user(),
        ], $status);
    }
}
