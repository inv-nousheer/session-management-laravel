<?php
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;


Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout']);

Route::post('/session/{id}/add-members', [SessionController::class, 'addMembers']);
Route::get('/session/{id}/members', [SessionController::class, 'getMembers']);
Route::apiResource('sessions', SessionController::class);
Route::apiResource('users', UserController::class);

