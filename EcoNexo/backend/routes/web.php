<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| API Routes (prefixed /api)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware('cors.api')->group(function () {
    // Handle OPTIONS preflight for all API routes (needed for PUT/DELETE CORS)
    Route::options('{any}', fn () => response('', 204))->where('any', '.*');

    // Auth (public)
    Route::post('/auth/login',              [AuthController::class, 'login']);
    Route::post('/auth/register',           [AuthController::class, 'register']);
    Route::post('/auth/register-negocio',   [AuthController::class, 'registerBusiness']);

    // Auth (protected)
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // Profile
        Route::put('/perfil',             [ProfileController::class, 'update']);
        Route::put('/perfil/password',    [ProfileController::class, 'changePassword']);
        Route::delete('/perfil',          [ProfileController::class, 'deleteAccount']);
        Route::post('/perfil/avatar',     [ProfileController::class, 'uploadAvatar']);
    });

    // Negocios
    Route::get('/negocios',              [BusinessController::class, 'index']);
    Route::get('/negocios/{business}',   [BusinessController::class, 'show']);
});
