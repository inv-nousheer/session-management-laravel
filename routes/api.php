<?php
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AssessmentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CommentController;



Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
Route::post('/logout', [AuthController::class, 'logout']);

Route::post('/session/{id}/add-members', [SessionController::class, 'addMembers']);
Route::get('/session/{id}/members', [SessionController::class, 'getMembers']);
Route::post('/sessions/{id}/duplicate', [SessionController::class, 'duplicate']);
Route::get('/sessions/{id}/report', [SessionController::class, 'report']);
Route::get('/sessions/users/{userId}/report', [SessionController::class, 'userReport']);
Route::get('/sessions/user/{user_id}/as-team-lead/members', [SessionController::class, 'teamLeadMemberLists']);
Route::get('/sessions/user/{user_id}', [SessionController::class, 'userSessions']);
Route::get('/sessions/tags', [SessionController::class, 'tags']);
Route::apiResource('sessions', SessionController::class);
Route::get('/seminar-users/{id}', [UserController::class, 'seminarUsers']);

Route::post('/users/import', [\App\Http\Controllers\ImportUsersController::class, 'import']);
Route::apiResource('users', UserController::class);
Route::apiResource('assessments', AssessmentController::class);
Route::post('/project-uploads', [AssessmentController::class, 'uploadProject']);
Route::post('/project-uploads/{id}/score', [CommentController::class, 'updateScore']);
Route::get('/sessions/{id}/assessments', [AssessmentController::class, 'forSession']);
Route::get('/sessions/{sessionId}/assessments/{assessmentId}/member-scores', [SessionController::class, 'assessmentMemberScores']);
Route::apiResource('comments', CommentController::class);
Route::get('/sessions-assessments/{id}', [AssessmentController::class, 'index']);
Route::get('/users-assessments/{session_id}/{user_id}', [AssessmentController::class, 'userAssessments']);
Route::get('/download/{id}', [AssessmentController::class, 'download']);
Route::post('/request-extension', [AssessmentController::class, 'requestExtension']);
Route::get('/sessions/{id}/reopen-requests', [AssessmentController::class, 'reopenRequestsForSession']);
Route::patch('/reopen-requests/{id}', [AssessmentController::class, 'updateReopenRequestStatus']);
Route::get('/dashboard-data', [SessionController::class, 'dashboardData']);
Route::post('/session-member/delete/{id}', [SessionController::class, 'destroySessionMembers']);

