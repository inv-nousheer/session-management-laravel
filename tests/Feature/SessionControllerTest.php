<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\ProjectUpload;
use App\Models\Session;
use App\Models\SessionMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_a_session_with_tags_and_team_leads(): void
    {
        $creator = User::factory()->create();
        $teamLead = User::factory()->create();

        $response = $this->postJson('/api/sessions', [
            'title' => 'Laravel workshop',
            'description' => 'Build a Laravel app.',
            'date' => '2026-05-20 10:00:00',
            'created_by' => $creator->id,
            'tags' => ['laravel', 'testing'],
            'teamlead_ids' => [$teamLead->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Laravel workshop')
            ->assertJsonPath('description', 'Build a Laravel app.')
            ->assertJsonPath('created_by', $creator->id)
            ->assertJsonPath('tags', 'laravel,testing');

        $this->assertDatabaseHas('events', [
            'id' => $response->json('id'),
            'title' => 'Laravel workshop',
            'tags' => 'laravel,testing',
        ]);
        $this->assertDatabaseHas('events_users', [
            'events_id' => $response->json('id'),
            'users_id' => $teamLead->id,
            'role' => 2,
            'status' => 1,
        ]);
    }

    public function test_it_validates_required_session_fields_when_storing(): void
    {
        $this->postJson('/api/sessions', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'date', 'created_by']);
    }

    public function test_it_shows_updates_and_deletes_a_session(): void
    {
        $session = $this->createSession();
        $oldTeamLead = User::factory()->create();
        $newTeamLead = User::factory()->create();
        SessionMember::create([
            'events_id' => $session->id,
            'users_id' => $oldTeamLead->id,
            'role' => 2,
            'status' => 1,
        ]);

        $this->getJson("/api/sessions/{$session->id}")
            ->assertOk()
            ->assertJsonPath('id', $session->id)
            ->assertJsonPath('title', $session->title);

        $this->putJson("/api/sessions/{$session->id}", [
            'title' => 'Updated workshop',
            'description' => 'Updated description.',
            'date' => '2026-05-25 15:00:00',
            'teamlead_ids' => [$newTeamLead->id],
        ])
            ->assertOk()
            ->assertJsonPath('title', 'Updated workshop')
            ->assertJsonPath('description', 'Updated description.');

        $this->assertDatabaseHas('events_users', [
            'events_id' => $session->id,
            'users_id' => $newTeamLead->id,
            'role' => 2,
        ]);
        $this->assertDatabaseMissing('events_users', [
            'events_id' => $session->id,
            'users_id' => $oldTeamLead->id,
            'role' => 2,
        ]);

        $this->deleteJson("/api/sessions/{$session->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Session deleted');

        $this->assertDatabaseMissing('events', [
            'id' => $session->id,
        ]);
    }

    public function test_it_lists_sessions_for_a_user_as_creator_or_member(): void
    {
        $user = User::factory()->create();
        $createdSession = $this->createSession(['created_by' => $user->id, 'title' => 'Created session']);
        $memberSession = $this->createSession(['title' => 'Member session']);
        $otherSession = $this->createSession(['title' => 'Other session']);
        SessionMember::create([
            'events_id' => $memberSession->id,
            'users_id' => $user->id,
            'role' => 1,
            'status' => 1,
        ]);

        $response = $this->getJson("/api/sessions/user/{$user->id}");

        $response->assertOk()
            ->assertJsonFragment(['id' => $createdSession->id])
            ->assertJsonFragment(['id' => $memberSession->id])
            ->assertJsonMissing(['id' => $otherSession->id]);
    }

    public function test_it_returns_distinct_sorted_tags(): void
    {
        $this->createSession(['tags' => 'php, Laravel']);
        $this->createSession(['tags' => 'testing,laravel']);

        $this->getJson('/api/sessions/tags')
            ->assertOk()
            ->assertExactJson(['Laravel', 'php', 'testing']);
    }

    public function test_it_returns_team_lead_member_lists(): void
    {
        $teamLead = User::factory()->create();
        $member = User::factory()->create();
        $session = $this->createSession(['title' => 'Team session']);
        SessionMember::create([
            'events_id' => $session->id,
            'users_id' => $teamLead->id,
            'role' => 2,
            'status' => 1,
        ]);
        SessionMember::create([
            'events_id' => $session->id,
            'users_id' => $member->id,
            'role' => 1,
            'status' => 1,
        ]);

        $response = $this->getJson("/api/sessions/user/{$teamLead->id}/as-team-lead/members");

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.session.id', $session->id)
            ->assertJsonPath('0.members.0.user.id', $teamLead->id)
            ->assertJsonPath('0.members.1.user.id', $member->id);
    }

    public function test_it_returns_empty_team_lead_member_lists_when_user_is_not_a_team_lead(): void
    {
        $user = User::factory()->create();

        $this->getJson("/api/sessions/user/{$user->id}/as-team-lead/members")
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_it_adds_and_lists_session_members(): void
    {
        $session = $this->createSession();
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $assessment = $this->createAssessment($session);

        $this->postJson("/api/session/{$session->id}/add-members", [
            'user_ids' => [$firstUser->id, $secondUser->id],
        ])
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.user.id', $firstUser->id)
            ->assertJsonPath('1.user.id', $secondUser->id);

        $this->getJson("/api/session/{$session->id}/members")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.assessments.0.id', $assessment->id)
            ->assertJsonPath('0.user.id', $firstUser->id);
    }

    public function test_it_validates_add_members_payload(): void
    {
        $session = $this->createSession();

        $this->postJson("/api/session/{$session->id}/add-members", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user_ids');
    }

    public function test_it_duplicates_a_session_with_members(): void
    {
        $creator = User::factory()->create();
        $newCreator = User::factory()->create();
        $member = User::factory()->create();
        $session = $this->createSession([
            'created_by' => $creator->id,
            'title' => 'Original session',
            'tags' => 'php,testing',
        ]);
        SessionMember::create([
            'events_id' => $session->id,
            'users_id' => $member->id,
            'role' => 1,
            'status' => 1,
        ]);

        $response = $this->postJson("/api/sessions/{$session->id}/duplicate", [
            'created_by' => $newCreator->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Session duplicated successfully')
            ->assertJsonPath('session.title', 'Original session (Copy)')
            ->assertJsonPath('session.created_by', $newCreator->id);

        $this->assertDatabaseHas('events_users', [
            'events_id' => $response->json('session.id'),
            'users_id' => $member->id,
            'role' => 1,
        ]);
    }

    public function test_it_returns_latest_scores_for_session_members_on_an_assessment(): void
    {
        $session = $this->createSession();
        $assessment = $this->createAssessment($session);
        $member = $this->createSessionMember($session);
        ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/old.zip',
            'file_name' => 'old.zip',
            'score' => 70,
        ]);
        ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/latest.zip',
            'file_name' => 'latest.zip',
            'score' => 95,
        ]);

        $this->getJson("/api/sessions/{$session->id}/assessments/{$assessment->id}/member-scores")
            ->assertOk()
            ->assertJsonPath("scores.{$member->id}", 95);
    }

    public function test_it_returns_not_found_for_scores_when_assessment_is_not_in_session(): void
    {
        $session = $this->createSession();
        $otherSession = $this->createSession();
        $assessment = $this->createAssessment($otherSession);

        $this->getJson("/api/sessions/{$session->id}/assessments/{$assessment->id}/member-scores")
            ->assertNotFound();
    }

    public function test_it_downloads_a_session_report(): void
    {
        $session = $this->createSession(['title' => 'Report Session']);
        $assessment = $this->createAssessment($session);
        $member = $this->createSessionMember($session);
        ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
            'score' => 88,
        ]);

        $this->get("/api/sessions/{$session->id}/report")
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertHeader('content-disposition');
    }

    public function test_it_downloads_a_user_report(): void
    {
        $session = $this->createSession(['title' => 'User Report Session']);
        $assessment = $this->createAssessment($session);
        $member = $this->createSessionMember($session);
        ProjectUpload::create([
            'events_users_id' => $member->id,
            'events_assessments_id' => $assessment->id,
            'file_path' => 'public/uploads/project.zip',
            'file_name' => 'project.zip',
            'score' => 76,
        ]);

        $this->get("/api/sessions/users/{$member->users_id}/report")
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertHeader('content-disposition');
    }

    public function test_it_deletes_a_session_member(): void
    {
        $member = $this->createSessionMember($this->createSession());

        $this->postJson("/api/session-member/delete/{$member->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Session Member deleted');

        $this->assertDatabaseMissing('events_users', [
            'id' => $member->id,
        ]);
    }

    private function createSession(array $overrides = []): Session
    {
        return Session::create(array_merge([
            'title' => 'Laravel workshop',
            'description' => 'Hands-on session',
            'created_by' => User::factory()->create()->id,
            'date' => '2026-05-20 10:00:00',
            'tags' => 'laravel,testing',
            'status' => 1,
        ], $overrides));
    }

    private function createSessionMember(Session $session, array $overrides = []): SessionMember
    {
        return SessionMember::create(array_merge([
            'events_id' => $session->id,
            'users_id' => User::factory()->create()->id,
            'role' => 1,
            'status' => 1,
        ], $overrides));
    }

    private function createAssessment(Session $session, array $overrides = []): Assessment
    {
        return Assessment::create(array_merge([
            'events_id' => $session->id,
            'name' => 'Project assessment',
            'start_date_time' => '2026-05-21 09:00:00',
            'end_date_time' => '2026-05-24 17:00:00',
            'supporting_files' => null,
            'description' => 'Submit the finished project.',
            'status' => 1,
        ], $overrides));
    }
}
