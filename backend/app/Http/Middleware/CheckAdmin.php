<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth('api')->check()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $user = auth('api')->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'No tienes permiso para acceder a este recurso'], 403);
        }

        return $next($request);
    }
}
