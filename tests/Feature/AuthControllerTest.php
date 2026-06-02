<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['jwt.secret' => str_repeat('a', 64)]);
    }

    public function test_it_registers_a_user_and_returns_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'user',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'User registered successfully')
            ->assertJsonPath('user.name', 'Test User')
            ->assertJsonPath('user.email', 'test@example.com')
            ->assertJsonPath('user.role', 'user')
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'role'],
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'user',
        ]);

        $this->assertTrue(Hash::check('secret123', User::where('email', 'test@example.com')->first()->password));
    }

    public function test_it_validates_registration_data(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'taken@example.com',
            'password' => 'short',
            'password_confirmation' => 'different',
            'role' => 'manager',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
                'role',
            ]);
    }

    public function test_it_logs_in_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', 'login@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure(['token', 'user']);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_it_rejects_invalid_login_credentials(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('error', 'Invalid credentials');
    }

    public function test_it_validates_login_data(): void
    {
        $this->postJson('/api/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_it_sends_a_generic_forgot_password_response_for_existing_users(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this->postJson('/api/forgot-password', [
            'email' => 'reset@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'If an account exists for this email, a password reset link has been sent.');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_it_sends_a_generic_forgot_password_response_for_unknown_users(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'If an account exists for this email, a password reset link has been sent.');

        Notification::assertNothingSent();
    }

    public function test_it_validates_forgot_password_email(): void
    {
        $this->postJson('/api/forgot-password', [
            'email' => 'not-an-email',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_it_resets_a_password_with_a_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => Hash::make('old-password'),
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'reset@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Password reset successfully.');

        $user->refresh();
        $this->assertTrue(Hash::check('new-password', $user->password));
        $this->assertNotNull($user->remember_token);
    }

    public function test_it_rejects_password_reset_with_an_invalid_token(): void
    {
        User::factory()->create(['email' => 'reset@example.com']);

        $this->postJson('/api/reset-password', [
            'token' => 'invalid-token',
            'email' => 'reset@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['error']);
    }

    public function test_it_validates_reset_password_data(): void
    {
        $this->postJson('/api/reset-password', [
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token', 'email', 'password']);
    }

    public function test_it_logs_out_with_a_valid_token(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Successfully logged out');
    }

    public function test_it_redirects_to_google_for_authentication(): void
    {
        $provider = \Mockery::mock();
        $googleRedirect = new RedirectResponse('https://accounts.google.com/o/oauth2/auth');

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $provider->shouldReceive('stateless')
            ->once()
            ->andReturnSelf();

        $provider->shouldReceive('redirect')
            ->once()
            ->andReturn($googleRedirect);

        $this->get('/api/auth/google')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_it_handles_google_callback_creates_user_and_redirects_with_token(): void
    {
        $provider = \Mockery::mock();
        $googleUser = (object) [
            'name' => 'Google User',
            'email' => 'google@example.com',
        ];

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $provider->shouldReceive('stateless')
            ->once()
            ->andReturnSelf();

        $provider->shouldReceive('user')
            ->once()
            ->andReturn($googleUser);

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'http://127.0.0.1:8000/auth-success?token=',
            $response->headers->get('Location')
        );

        $this->assertDatabaseHas('users', [
            'name' => 'Google User',
            'email' => 'google@example.com',
            'role' => 'member',
        ]);

        $token = Str::after($response->headers->get('Location'), 'token=');
        $this->assertNotEmpty((string) $token);
    }
}
