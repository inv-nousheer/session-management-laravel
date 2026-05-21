<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Comment;
use App\Models\ProjectUpload;
use App\Models\Session;
use App\Models\SessionMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_comments(): void
    {
        [$upload, $assessment, $user] = $this->createProjectUploadContext();
        Comment::create($this->commentAttributes($upload, $assessment, $user, [
            'comments' => 'First comment',
        ]));
        Comment::create($this->commentAttributes($upload, $assessment, $user, [
            'comments' => 'Second comment',
        ]));

        $response = $this->getJson('/api/comments');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.comments', 'First comment')
            ->assertJsonPath('1.comments', 'Second comment');
    }

    public function test_it_stores_a_comment_for_a_project_upload(): void
    {
        [$upload, $assessment, $user] = $this->createProjectUploadContext();

        $response = $this->postJson('/api/comments', [
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $user->id,
            'comments' => 'Please add installation instructions.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('events_users_events_assessments_id', $upload->id)
            ->assertJsonPath('events_assessments_id', $assessment->id)
            ->assertJsonPath('users_id', $user->id)
            ->assertJsonPath('comments', 'Please add installation instructions.');

        $this->assertDatabaseHas('comments', [
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $user->id,
            'comments' => 'Please add installation instructions.',
        ]);
    }

    public function test_it_stores_a_reply_to_an_existing_comment(): void
    {
        [$upload, $assessment, $user] = $this->createProjectUploadContext();
        $parent = Comment::create($this->commentAttributes($upload, $assessment, $user, [
            'comments' => 'Parent comment',
        ]));

        $response = $this->postJson('/api/comments', [
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $user->id,
            'comments' => 'Reply comment',
            'parent_id' => $parent->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('comments', 'Reply comment')
            ->assertJsonPath('parent_id', $parent->id);

        $this->assertDatabaseHas('comments', [
            'parent_id' => $parent->id,
            'comments' => 'Reply comment',
        ]);
    }

    public function test_it_validates_required_comment_fields(): void
    {
        $this->postJson('/api/comments', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'events_users_events_assessments_id',
                'events_assessments_id',
                'users_id',
                'comments',
            ]);
    }

    public function test_it_rejects_comments_when_assessment_does_not_match_the_upload(): void
    {
        [$upload, , $user] = $this->createProjectUploadContext();
        $otherAssessment = Assessment::create($this->assessmentAttributes([
            'events_id' => $upload->assessment->events_id,
            'name' => 'Different assessment',
        ]));

        $this->postJson('/api/comments', [
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $otherAssessment->id,
            'users_id' => $user->id,
            'comments' => 'This should not be accepted.',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('events_assessments_id');
    }

    public function test_it_shows_a_comment(): void
    {
        [$upload, $assessment, $user] = $this->createProjectUploadContext();
        $comment = Comment::create($this->commentAttributes($upload, $assessment, $user, [
            'comments' => 'Visible comment',
        ]));

        $this->getJson("/api/comments/{$comment->id}")
            ->assertOk()
            ->assertJsonPath('id', $comment->id)
            ->assertJsonPath('comments', 'Visible comment');
    }

    public function test_it_updates_a_comment_submission_reference(): void
    {
        [$upload, $assessment, $user, $member] = $this->createProjectUploadContext();
        $comment = Comment::create($this->commentAttributes($upload, $assessment, $user));
        $newUpload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/revised.zip',
            'file_name' => 'revised.zip',
        ]);

        $this->putJson("/api/comments/{$comment->id}", [
            'events_users_events_assessments_id' => $newUpload->id,
        ])
            ->assertOk()
            ->assertJsonPath('events_users_events_assessments_id', $newUpload->id);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'events_users_events_assessments_id' => $newUpload->id,
        ]);
    }

    public function test_it_deletes_a_comment(): void
    {
        [$upload, $assessment, $user] = $this->createProjectUploadContext();
        $comment = Comment::create($this->commentAttributes($upload, $assessment, $user));

        $this->deleteJson("/api/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('comments', [
            'id' => $comment->id,
        ]);
    }

    public function test_it_updates_a_project_upload_score(): void
    {
        [$upload] = $this->createProjectUploadContext();

        $this->postJson("/api/project-uploads/{$upload->id}/score", [
            'score' => 85,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Score updated successfully.')
            ->assertJsonPath('upload.id', $upload->id)
            ->assertJsonPath('upload.score', 85);

        $this->assertDatabaseHas('events_users_events_assessments', [
            'id' => $upload->id,
            'score' => 85,
        ]);
    }

    public function test_it_validates_project_upload_score(): void
    {
        [$upload] = $this->createProjectUploadContext();

        $this->postJson("/api/project-uploads/{$upload->id}/score", [
            'score' => 101,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('score');
    }

    private function createProjectUploadContext(): array
    {
        $session = $this->createSession();
        $user = User::factory()->create();
        $member = SessionMember::create([
            'events_id' => $session->id,
            'users_id' => $user->id,
            'role' => 1,
            'status' => 1,
        ]);
        $assessment = Assessment::create($this->assessmentAttributes([
            'events_id' => $session->id,
        ]));
        $upload = ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
        ]);

        return [$upload, $assessment, $user, $member, $session];
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

    private function commentAttributes(
        ProjectUpload $upload,
        Assessment $assessment,
        User $user,
        array $overrides = []
    ): array {
        return array_merge([
            'events_users_events_assessments_id' => $upload->id,
            'events_assessments_id' => $assessment->id,
            'users_id' => $user->id,
            'comments' => 'Initial feedback.',
        ], $overrides);
    }
}
