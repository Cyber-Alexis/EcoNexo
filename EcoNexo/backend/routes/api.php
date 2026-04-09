<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Handle OPTIONS preflight for all API routes (needed for PUT/DELETE CORS)
Route::options('{any}', fn () => response('', 204))->where('any', '.*');

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no auth required)
Route::post('/auth/login',              [AuthController::class, 'login']);
Route::middleware(['system.maintenance'])->group(function () {
    Route::post('/auth/register',           [AuthController::class, 'register']);
    Route::post('/auth/register-negocio',   [AuthController::class, 'registerBusiness']);
    Route::get('/negocios',              [BusinessController::class, 'index']);
    Route::get('/negocios/{business}',   [BusinessController::class, 'show']);
    Route::get('/productos',             [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/categorias',            [\App\Http\Controllers\ProductController::class, 'categories']);
});

/*
|--------------------------------------------------------------------------
| Protected API Routes (require auth:api)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'system.maintenance'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Profile
    Route::put('/perfil',             [ProfileController::class, 'update']);
    Route::put('/perfil/password',    [ProfileController::class, 'changePassword']);
    Route::delete('/perfil',          [ProfileController::class, 'deleteAccount']);
    Route::post('/perfil/avatar',     [ProfileController::class, 'uploadAvatar']);

    // Orders
    Route::post('/orders',  [OrderController::class, 'store']);
    Route::get('/orders',   [OrderController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes (require auth:api + check.admin middleware)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', \App\Http\Middleware\CheckAdmin::class])->group(function () {
    Route::get('/admin/users',                  [AdminController::class, 'getAllUsers']);
    Route::get('/admin/users/{id}',             [AdminController::class, 'getUserById']);
    Route::post('/admin/users',                 [AdminController::class, 'createUser']);
    Route::put('/admin/users/{id}',             [AdminController::class, 'updateUser']);
    Route::patch('/admin/users/{id}/status',    [AdminController::class, 'changeUserStatus']);
    Route::delete('/admin/users/{id}',          [AdminController::class, 'deleteUser']);
    Route::get('/admin/statistics',             [AdminController::class, 'getStatistics']);
    Route::get('/admin/settings',               [AdminController::class, 'getSettings']);
    Route::put('/admin/settings/general',       [AdminController::class, 'updateGeneralSettings']);
    Route::put('/admin/settings/notifications', [AdminController::class, 'updateNotificationSettings']);
    Route::put('/admin/settings/maintenance',   [AdminController::class, 'updateMaintenanceSettings']);
    Route::post('/admin/settings/check-updates',[AdminController::class, 'checkForUpdates']);
});
