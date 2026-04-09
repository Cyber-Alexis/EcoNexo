<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class EnsureActiveApiUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('api');

        if (!$user) {
            return response()->json([
                'message' => 'Sesión no válida o expirada.',
            ], 401);
        }

        if ($user->status === 'bloqueado') {
            try {
                auth('api')->logout();
            } catch (Throwable) {
            }

            return response()->json([
                'message' => 'Has sido bloqueado por incumplir las normativas',
            ], 403);
        }

        return $next($request);
    }
}