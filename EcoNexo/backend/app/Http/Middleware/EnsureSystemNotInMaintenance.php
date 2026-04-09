<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSystemNotInMaintenance
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->maintenanceEnabled()) {
            return $next($request);
        }

        if ($request->is('api/admin/*')) {
            return $next($request);
        }

        if ($request->is('api/auth/login')) {
            $email = (string) $request->input('email');
            $user = $email !== '' ? User::where('email', $email)->first() : null;

            if ($user?->role === 'admin') {
                return $next($request);
            }
        }

        if ($request->user('api')?->role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'message' => 'La plataforma está temporalmente en modo mantenimiento. Vuelve a intentarlo más tarde.',
        ], 503);
    }

    private function maintenanceEnabled(): bool
    {
        $setting = SystemSetting::query()->where('key', 'maintenance')->first();

        return (bool) data_get($setting?->value, 'enabled', false);
    }
}