<?php

namespace Tests\Feature;

use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_users(): void
    {
        $firstUser = User::factory()->create([
            'name' => 'Alice User',
            'email' => 'alice@example.com',
            'role' => 'member',
        ]);
        $secondUser = User::factory()->create([
            'name' => 'Bob User',
            'email' => 'bob@example.com',
            'role' => 'tl',
        ]);

        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', $firstUser->id)
            ->assertJsonPath('0.name', 'Alice User')
            ->assertJsonPath('1.id', $secondUser->id)
            ->assertJsonPath('1.name', 'Bob User');
    }

    public function test_it_paginates_users_when_requested(): void
    {
        User::factory()->count(12)->create();

        $response = $this->getJson('/api/users?page=2&per_page=5');

        $response->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonPath('per_page', 5)
            ->assertJsonPath('from', 6)
            ->assertJsonPath('to', 10)
            ->assertJsonPath('total', 12)
            ->assertJsonCount(5, 'data');
    }

    public function test_it_stores_a_user(): void
    {
        $response = $this->postJson('/api/users', [
            'name' => 'New Member',
            'email' => 'new.member@example.com',
            'password' => 'secret123',
            'role' => 'member',
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'New Member')
            ->assertJsonPath('email', 'new.member@example.com')
            ->assertJsonPath('role', 'member');

        $this->assertDatabaseHas('users', [
            'name' => 'New Member',
            'email' => 'new.member@example.com',
            'role' => 'member',
        ]);
        $this->assertTrue(Hash::check('secret123', User::where('email', 'new.member@example.com')->first()->password));
    }

    public function test_it_validates_user_creation_data(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/users', [
            'name' => '',
            'email' => 'taken@example.com',
            'password' => 'short',
            'role' => 'manager',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
                'role',
            ]);
    }

    public function test_it_shows_a_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Visible User',
            'email' => 'visible@example.com',
            'role' => 'user',
        ]);

        $this->getJson("/api/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('name', 'Visible User')
            ->assertJsonPath('email', 'visible@example.com')
            ->assertJsonMissingPath('password');
    }

    public function test_it_updates_a_user_without_changing_password_when_password_is_empty(): void
    {
        $user = User::factory()->create([
            'email' => 'old@example.com',
            'password' => Hash::make('old-password'),
            'role' => 'member',
        ]);
        $originalPassword = $user->password;

        $this->putJson("/api/users/{$user->id}", [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'password' => '',
            'role' => 'tl',
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Updated User')
            ->assertJsonPath('email', 'updated@example.com')
            ->assertJsonPath('role', 'tl');

        $user->refresh();
        $this->assertSame($originalPassword, $user->password);
    }

    public function test_it_updates_a_user_password_when_provided(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->putJson("/api/users/{$user->id}", [
            'password' => 'new-password',
        ])
            ->assertOk()
            ->assertJsonPath('id', $user->id);

        $user->refresh();
        $this->assertTrue(Hash::check('new-password', $user->password));
    }

    public function test_it_allows_a_user_to_keep_their_existing_email_when_updating(): void
    {
        $user = User::factory()->create([
            'email' => 'same@example.com',
        ]);

        $this->putJson("/api/users/{$user->id}", [
            'name' => 'Same Email User',
            'email' => 'same@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Same Email User')
            ->assertJsonPath('email', 'same@example.com');
    }

    public function test_it_rejects_duplicate_email_when_updating(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['email' => 'current@example.com']);

        $this->putJson("/api/users/{$user->id}", [
            'email' => 'taken@example.com',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_it_deletes_a_user(): void
    {
        $user = User::factory()->create();

        $this->deleteJson("/api/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('message', 'User deleted');

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    }

    public function test_it_lists_seminar_users_excluding_admins_and_session_creator(): void
    {
        $creator = User::factory()->create([
            'name' => 'Creator User',
            'role' => 'member',
        ]);
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'role' => 'admin',
        ]);
        $member = User::factory()->create([
            'name' => 'Member User',
            'role' => 'member',
        ]);
        $teamLead = User::factory()->create([
            'name' => 'Team Lead User',
            'role' => 'tl',
        ]);
        $session = Session::create([
            'title' => 'Laravel workshop',
            'description' => 'Hands-on session',
            'created_by' => $creator->id,
            'date' => '2026-05-20 10:00:00',
            'tags' => 'laravel,testing',
            'status' => 1,
        ]);

        $response = $this->getJson("/api/seminar-users/{$session->id}");

        $response->assertOk()
            ->assertJsonFragment(['id' => $member->id])
            ->assertJsonFragment(['id' => $teamLead->id])
            ->assertJsonMissing(['id' => $creator->id])
            ->assertJsonMissing(['id' => $admin->id]);
    }
}
