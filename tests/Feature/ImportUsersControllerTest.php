<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ImportUsersControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_imports_users_from_a_csv_file(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'users.csv',
            "name,email\nAlice Smith,alice@example.com\nBob Jones,bob@example.com\n"
        );

        $response = $this->postJson('/api/users/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('imported', 2)
            ->assertJsonPath('errors', []);

        $this->assertDatabaseHas('users', [
            'name' => 'Alice Smith',
            'email' => 'alice@example.com',
            'role' => 'member',
        ]);
        $this->assertDatabaseHas('users', [
            'name' => 'Bob Jones',
            'email' => 'bob@example.com',
            'role' => 'member',
        ]);

        $this->assertTrue(Hash::check('password', User::where('email', 'alice@example.com')->first()->password));
    }

    public function test_it_skips_invalid_rows_and_reports_errors(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $file = UploadedFile::fake()->createWithContent(
            'users.csv',
            "name,email\nValid User,valid@example.com\nMissing Email,\nDuplicate User,existing@example.com\nInvalid Email,not-an-email\n"
        );

        $response = $this->postJson('/api/users/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('imported', 1)
            ->assertJsonCount(3, 'errors')
            ->assertJsonPath('errors.0.row.0', 'Missing Email')
            ->assertJsonPath('errors.1.row.1', 'existing@example.com')
            ->assertJsonPath('errors.2.row.1', 'not-an-email');

        $this->assertDatabaseHas('users', [
            'name' => 'Valid User',
            'email' => 'valid@example.com',
            'role' => 'member',
        ]);
        $this->assertDatabaseMissing('users', [
            'email' => 'not-an-email',
        ]);
    }

    public function test_it_validates_that_a_csv_file_is_required(): void
    {
        $this->postJson('/api/users/import', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_it_rejects_non_csv_files(): void
    {
        $file = UploadedFile::fake()->createWithContent('users.pdf', 'not a csv');

        $this->postJson('/api/users/import', [
            'file' => $file,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }
}
