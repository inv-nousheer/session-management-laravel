<?php

namespace Tests\Feature;

use App\Mail\AssessmentSubmissionUploaded;
use App\Models\Assessment;
use App\Models\AssessmentReopenRequest;
use App\Models\Comment;
use App\Models\ProjectUpload;
use App\Models\Session;
use App\Models\SessionMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AssessmentControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_assessments_for_a_session_with_related_data(): void
    {
        [$session, $member, $assessment] = $this->createAssessmentContext();
        $upload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
        ]);
        Comment::create([
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $member->users_id,
            'comments' => 'Looks good',
        ]);
        AssessmentReopenRequest::create([
            'events_assessments_id' => $assessment->id,
            'events_users_id' => $member->id,
            'status' => 0,
        ]);
        Assessment::create($this->assessmentAttributes([
            'events_id' => $session->id,
            'name' => 'Second assessment',
        ]));

        $response = $this->getJson("/api/sessions-assessments/{$session->id}");

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.name', $assessment->name)
            ->assertJsonPath('0.comments.0.comments', 'Looks good')
            ->assertJsonPath('0.reopen_requests.0.status', 0)
            ->assertJsonPath('0.session.session_members.0.user.id', $member->users_id);
    }

    public function test_it_stores_an_assessment_with_a_supporting_file(): void
    {
        Storage::fake('local');
        $session = $this->createSession();
        $file = UploadedFile::fake()->create('brief.pdf', 12, 'application/pdf');

        $response = $this->postJson('/api/assessments', [
            'events_id' => $session->id,
            'name' => 'Final project',
            'start_date_time' => '2026-05-21 09:00:00',
            'end_date_time' => '2026-05-28 17:00:00',
            'supporting_files' => $file,
            'description' => 'Build and submit the project.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('events_id', $session->id)
            ->assertJsonPath('name', 'Final project');

        $this->assertDatabaseHas('events_assessments', [
            'events_id' => $session->id,
            'name' => 'Final project',
            'description' => 'Build and submit the project.',
        ]);

        $storedPath = $response->json('supporting_files');
        $this->assertNotNull($storedPath);
        $this->assertTrue(Storage::disk('local')->exists($storedPath));
    }

    public function test_it_validates_required_assessment_fields_when_storing(): void
    {
        $response = $this->postJson('/api/assessments', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'events_id',
                'name',
                'start_date_time',
                'end_date_time',
            ]);
    }

    public function test_it_shows_updates_and_deletes_an_assessment(): void
    {
        [, , $assessment] = $this->createAssessmentContext();

        $this->getJson("/api/assessments/{$assessment->id}")
            ->assertOk()
            ->assertJsonPath('id', $assessment->id);

        $this->putJson("/api/assessments/{$assessment->id}", [
            'name' => 'Updated assessment',
            'end_date_time' => '2026-05-25 17:00:00',
            'description' => 'Updated requirements.',
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Updated assessment')
            ->assertJsonPath('description', 'Updated requirements.');

        $this->assertDatabaseHas('events_assessments', [
            'id' => $assessment->id,
            'name' => 'Updated assessment',
            'description' => 'Updated requirements.',
        ]);

        $this->deleteJson("/api/assessments/{$assessment->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Assessment deleted');

        $this->assertDatabaseMissing('events_assessments', [
            'id' => $assessment->id,
        ]);
    }

    public function test_it_updates_an_assessment_with_a_supporting_file(): void
    {
        Storage::fake('local');
        [, , $assessment] = $this->createAssessmentContext();
        $file = UploadedFile::fake()->create('updated-brief.pdf', 16, 'application/pdf');

        $response = $this->postJson("/api/assessments/{$assessment->id}", [
            '_method' => 'PUT',
            'name' => 'Assessment with updated file',
            'supporting_files' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Assessment with updated file');

        $storedPath = $response->json('supporting_files');
        $this->assertNotNull($storedPath);
        $this->assertTrue(Storage::disk('local')->exists($storedPath));
    }

    public function test_it_lists_assessments_for_a_session_in_id_order(): void
    {
        $session = $this->createSession();
        $first = Assessment::create($this->assessmentAttributes([
            'events_id' => $session->id,
            'name' => 'First',
        ]));
        $second = Assessment::create($this->assessmentAttributes([
            'events_id' => $session->id,
            'name' => 'Second',
        ]));

        $response = $this->getJson("/api/sessions/{$session->id}/assessments");

        $response->assertOk()
            ->assertJsonPath('0.id', $first->id)
            ->assertJsonPath('1.id', $second->id);
    }

    public function test_it_uploads_a_project_file_and_creates_a_comment(): void
    {
        Mail::fake();
        Storage::fake('local');
        [$session, $member, $assessment] = $this->createAssessmentContext();
        $file = UploadedFile::fake()->create('submission.zip', 24, 'application/zip');

        $response = $this->postJson('/api/project-uploads', [
            'events_id' => $session->id,
            'user_id' => $member->users_id,
            'assessment_id' => $assessment->id,
            'file_path' => $file,
            'notes' => 'Please review the README first.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('events_users_id', $member->id)
            ->assertJsonPath('events_assessments_id', $assessment->id)
            ->assertJsonPath('file_name', 'submission.zip');

        $storedPath = $response->json('file_path');
        $this->assertTrue(Storage::disk('local')->exists($storedPath));

        $this->assertDatabaseHas('comments', [
            'events_users_events_assessments_id' => $response->json('id'),
            'events_assessments_id' => $assessment->id,
            'users_id' => $member->users_id,
            'comments' => 'New file uploaded: Please review the README first.',
        ]);

        $creator = User::findOrFail($session->created_by);
        Mail::assertQueued(AssessmentSubmissionUploaded::class, function ($mail) use ($creator) {
            return $mail->hasTo($creator->email);
        });
    }

    public function test_it_uploads_a_project_link_and_creates_a_comment(): void
    {
        Mail::fake();
        [$session, $member, $assessment] = $this->createAssessmentContext();

        $response = $this->postJson('/api/project-uploads', [
            'events_id' => $session->id,
            'user_id' => $member->users_id,
            'assessment_id' => $assessment->id,
            'submission_link' => 'https://example.com/submission',
        ]);

        $response->assertCreated()
            ->assertJsonPath('file_path', 'https://example.com/submission')
            ->assertJsonPath('file_name', 'https://example.com/submission');

        $this->assertDatabaseHas('comments', [
            'events_users_events_assessments_id' => $response->json('id'),
            'events_assessments_id' => $assessment->id,
            'users_id' => $member->users_id,
            'comments' => 'Project link submitted',
        ]);

        $creator = User::findOrFail($session->created_by);
        Mail::assertQueued(AssessmentSubmissionUploaded::class, function ($mail) use ($creator) {
            return $mail->hasTo($creator->email);
        });
    }

    public function test_it_downloads_uploaded_files_and_redirects_external_links(): void
    {
        Storage::fake('local');
        [, $member, $assessment] = $this->createAssessmentContext();
        Storage::disk('local')->put('public/uploads/project.zip', 'zip contents');
        $fileUpload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
        ]);
        $linkUpload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'https://example.com/project',
            'file_name' => 'https://example.com/project',
        ]);

        $this->get("/api/download/{$fileUpload->id}")
            ->assertOk()
            ->assertHeader('content-disposition');

        $this->get("/api/download/{$linkUpload->id}")
            ->assertRedirect('https://example.com/project');
    }

    public function test_it_downloads_assessment_supporting_file(): void
    {
        Storage::fake('local');
        [, , $assessment] = $this->createAssessmentContext();
        Storage::disk('local')->put('public/uploads/brief.pdf', 'brief contents');
        $assessment->update(['supporting_files' => 'public/uploads/brief.pdf']);

        $this->get("/api/assessments/{$assessment->id}/supporting-file")
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_it_returns_not_found_when_download_file_is_missing(): void
    {
        Storage::fake('local');
        [, $member, $assessment] = $this->createAssessmentContext();
        $upload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/missing.zip',
            'file_name' => 'missing.zip',
        ]);

        $this->getJson("/api/download/{$upload->id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'File not found');
    }

    public function test_it_lists_user_assessment_uploads_with_comments(): void
    {
        [$session, $member, $assessment] = $this->createAssessmentContext();
        $upload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
        ]);
        Comment::create([
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $member->users_id,
            'comments' => 'Submitted',
        ]);

        $response = $this->getJson("/api/users-assessments/{$session->id}/{$member->users_id}");

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $upload->id)
            ->assertJsonPath('0.assessment.id', $assessment->id)
            ->assertJsonPath('0.comments.0.comments', 'Submitted');
    }

    public function test_it_creates_and_lists_reopen_requests_for_a_session(): void
    {
        [$session, $member, $assessment] = $this->createAssessmentContext();

        $this->postJson('/api/request-extension', [
            'assessment_id' => $assessment->id,
            'events_id' => $session->id,
            'user_id' => $member->users_id,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Extension requested');

        $this->assertDatabaseHas('assessements_reopen_requests', [
            'events_assessments_id' => $assessment->id,
            'events_users_id' => $member->id,
            'status' => 0,
        ]);

        $response = $this->getJson("/api/sessions/{$session->id}/reopen-requests");

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.events_assessments_id', $assessment->id)
            ->assertJsonPath('0.session_member.user.id', $member->users_id)
            ->assertJsonPath('0.assessmemnt.id', $assessment->id);
    }

    public function test_it_updates_reopen_request_status(): void
    {
        [, $member, $assessment] = $this->createAssessmentContext();
        $reopenRequest = AssessmentReopenRequest::create([
            'events_assessments_id' => $assessment->id,
            'events_users_id' => $member->id,
            'status' => 0,
        ]);

        $this->patchJson("/api/reopen-requests/{$reopenRequest->id}", [
            'status' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('status', 1);

        $this->assertDatabaseHas('assessements_reopen_requests', [
            'id' => $reopenRequest->id,
            'status' => 1,
        ]);
    }

    public function test_it_rejects_invalid_reopen_request_status(): void
    {
        [, $member, $assessment] = $this->createAssessmentContext();
        $reopenRequest = AssessmentReopenRequest::create([
            'events_assessments_id' => $assessment->id,
            'events_users_id' => $member->id,
            'status' => 0,
        ]);

        $this->patchJson("/api/reopen-requests/{$reopenRequest->id}", [
            'status' => 3,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    private function createAssessmentContext(): array
    {
        $session = $this->createSession();
        $member = SessionMember::create([
            'events_id' => $session->id,
            'users_id' => User::factory()->create()->id,
            'role' => 1,
            'status' => 1,
        ]);
        $assessment = Assessment::create($this->assessmentAttributes([
            'events_id' => $session->id,
        ]));

        return [$session, $member, $assessment];
    }

    private function createSession(): Session
    {
        return Session::create([
            'title' => 'Laravel workshop',
            'description' => 'Hands-on session',
            'created_by' => User::factory()->create()->id,
            'date' => '2026-05-20 10:00:00',
            'tags' => 'laravel,testing',
            'status' => 1,
        ]);
    }

    private function assessmentAttributes(array $overrides = []): array
    {
        return array_merge([
            'events_id' => null,
            'name' => 'Project assessment',
            'start_date_time' => '2026-05-21 09:00:00',
            'end_date_time' => '2026-05-24 17:00:00',
            'supporting_files' => null,
            'description' => 'Submit the finished project.',
            'status' => 1,
        ], $overrides);
    }
}
