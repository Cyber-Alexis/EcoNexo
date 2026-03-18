<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusinessController;
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
    // Auth (public)
    Route::post('/auth/login',              [AuthController::class, 'login']);
    Route::post('/auth/register',           [AuthController::class, 'register']);
    Route::post('/auth/register-negocio',   [AuthController::class, 'registerBusiness']);

    // Auth (protected)
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);
    });

    // Negocios
    Route::get('/negocios',              [BusinessController::class, 'index']);
    Route::get('/negocios/{business}',   [BusinessController::class, 'show']);
});
