<?php

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
    Route::get('/negocios',        [BusinessController::class, 'index']);
    Route::get('/negocios/{business}', [BusinessController::class, 'show']);
});
