<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;
use App\Models\SessionMember;
use App\Models\Assessment;
use App\Models\ProjectUpload;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    // GET /api/sessions
    public function index($user_id)
    {
        return response()->json(Session::where('created_by', $user_id)->get());

    }

    // POST /api/sessions
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'created_by' => 'required',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
            'teamlead_ids' => 'sometimes|array',
            'teamlead_ids.*' => 'exists:users,id',
        ]);

        $teamleadIds = $validated['teamlead_ids'] ?? [];
        unset($validated['teamlead_ids']);

        $session = DB::transaction(function () use ($validated, $teamleadIds) {
            $session = Session::create($validated);

            if (!empty($teamleadIds)) {
                foreach (array_unique($teamleadIds) as $userId) {
                    SessionMember::updateOrCreate(
                        ['events_id' => $session->id, 'users_id' => $userId],
                        ['role' => 2, 'status' => 1]
                    );
                }
            }

            return $session;
        });

        return response()->json($session, 201);
    }

    // GET /api/sessions/{id}
    public function show($id)
    {
         $session = Session::findOrFail($id);
         return response()->json($session);
    }

    public function userSessions($user_id)
    {
        $sessions = Session::whereHas('sessionMembers', function ($q) use ($user_id) {
            $q->where('users_id', $user_id);
        })->orWhere('created_by', $user_id)
            ->with(['sessionMembers.user:id,name,email'])
            ->get();

        return response()->json($sessions);
    }

    /**
     * GET /api/sessions/user/{user_id}/as-team-lead/members
     * Sessions where the user is a team lead (events_users.role = 2), each with all session members (user included).
     */
    public function teamLeadMemberLists($user_id)
    {
        $userId = (int) $user_id;

        $sessionIds = SessionMember::query()
            ->where('users_id', $userId)
            ->where('role', 2)
            ->pluck('events_id')
            ->unique()
            ->values()
            ->all();

        if ($sessionIds === []) {
            return response()->json([]);
        }

        $sessions = Session::query()
            ->whereIn('id', $sessionIds)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        $payload = [];
        foreach ($sessions as $session) {
            $members = $session->sessionMembers()
                ->with('user')
                ->orderBy('id')
                ->distinct()
                ->get();
                array_push($payload,$members);
        }
        $uniqueMembers = collect($payload)
        ->flatten(1)
        ->unique('users_id')
        ->values();

        return response()->json($uniqueMembers);
    }

    // PUT /api/sessions/{id}
    public function update(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);
        $session->update($validated);
        return response()->json($session);
    }

    // DELETE /api/sessions/{id}
    public function destroy($id)
    {
        $session = Session::findOrFail($id);
        $session->delete();
        return response()->json(['message' => 'Session deleted']);
    }

    // POST /api/sessions/{id}/duplicate
    // Duplicates session + session members.
    public function duplicate(Request $request, $id)
    {
        $source = Session::with('sessionMembers')->findOrFail($id);

        $validated = $request->validate([
            'created_by' => 'nullable',
        ]);

        $createdBy = $validated['created_by'] ?? $source->created_by;

        $newSession = DB::transaction(function () use ($source, $createdBy) {
            $clone = Session::create([
                'title' => $source->title . ' (Copy)',
                'description' => $source->description,
                'created_by' => $createdBy,
                'date' => $source->date,
                'status' => $source->status,
                'tags' => $source->tags,
            ]);

            foreach ($source->sessionMembers as $member) {
                SessionMember::create([
                    'events_id' => $clone->id,
                    'users_id' => $member->users_id,
                    'role' => $member->role,
                    'status' => $member->status,
                ]);
            }

            return $clone;
        });

        return response()->json([
            'session' => $newSession,
            'message' => 'Session duplicated successfully',
        ], 201);
    }

    public function addMembers(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);
        foreach ($validated['user_ids'] as $userId) {
            SessionMember::updateOrCreate(
                ['events_id' => $session->id, 'users_id' => $userId],
                []
            );
        }
        $members = $session->sessionMembers()->with('user')
                   // ->with('assessments')

                    ->get();

        return response()->json($members);
    }
    public function getMembers($id)
    {
        $session = Session::findOrFail($id);
        $members = $session->sessionMembers()->with('assessments')
                    ->with('assessments.projectUploads')
                    ->with('user')
                    ->get();
        return response()->json($members);
    }
    public function dashboardData()
    {
        $totalSessions = Session::count();
        $sessionsPerMonth = Session::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();
        $assessments = Assessment::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();
        $totalassessments = Assessment::count();
        $pendingassessments = Assessment::whereDate('start_date_time', '<=', now())
            ->whereDate('end_date_time', '>=', now())
            ->count();
        $completedassessments = Assessment::where('end_date_time', '<=', now())->count();
        $recentSessions = Session::orderBy('id','DESC')->take(4)->get();
        $recentAssesments = Assessment::orderBy('id','DESC')->take(4)->get();

        return response()->json([
            'total_sessions' => $totalSessions,
            'sessions_per_month' => $sessionsPerMonth,
            'assessments_per_month' => $assessments,
            'total_assessments' => $totalassessments,
            'pending_assessments' => $pendingassessments,
            'completed_assessments' => $completedassessments,
            'recentSessions' => $recentSessions,
            'recentAssessments' => $recentAssesments
        ]);
    }

    // GET /api/sessions/{id}/report
    // CSV report containing assessments + members + uploads + score.
    public function report($id)
    {
        $session = Session::findOrFail($id);

        $assessments = Assessment::where('events_id', $session->id)
            ->orderBy('id')
            ->get();

        $members = SessionMember::with('user')
            ->where('events_id', $session->id)
            ->orderBy('id')
            ->get();

        $memberIds = $members->pluck('id')->all();
        $assessmentIds = $assessments->pluck('id')->all();

        $uploads = ProjectUpload::query()
            ->whereIn('events_users_id', $memberIds)
            ->whereIn('events_assessments_id', $assessmentIds)
            ->get(['id', 'events_users_id', 'events_assessments_id', 'file_name', 'file_path', 'score', 'created_at']);

        $uploadMap = [];
        foreach ($uploads as $u) {
            $uploadMap[$u->events_users_id . '-' . $u->events_assessments_id] = $u;
        }

        $safeTitle = preg_replace('/[^a-zA-Z0-9-_]+/', '_', $session->title ?? 'session');
        $filename = "session_{$session->id}_{$safeTitle}_report.csv";

        return response()->streamDownload(function () use ($session, $assessments, $members, $uploadMap) {
            $out = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'session_id',
                'session_title',
                'assessment_id',
                'assessment_name',
                'member_id',
                'member_name',
                'member_email',
                'file_name',
                'upload_date',
                'score',
            ]);

            foreach ($assessments as $assessment) {
                foreach ($members as $member) {
                    $user = $member->user;
                    $upload = $uploadMap[$member->id . '-' . $assessment->id] ?? null;

                    fputcsv($out, [
                        $session->id,
                        $session->title,
                        $assessment->id,
                        $assessment->name,
                        $user?->id ?? $member->users_id,
                        $user?->name ?? '',
                        $user?->email ?? '',
                        $upload?->file_name ?? 'file not uploaded',
                        $upload?->created_at?->toDateTimeString() ?? '',
                        $upload?->score ?? '',
                    ]);
                }
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    // GET /api/sessions/{sessionId}/users/{userId}/report
    // CSV report containing all assessments for a specific user in a session,
    // including upload name, upload date, and score (if available).
    public function userReport( $userId)
    {
        $session = SessionMember::where('users_id',$userId)->pluck('events_id')->toArray();

        $assessments = Assessment::whereIn('events_id', $session)
            ->orderBy('id')
            ->get(['id', 'events_id', 'name']);

        $member = SessionMember::with('user')
            ->whereIn('events_id', $session)
            ->where('users_id', $userId)
            ->firstOrFail();

        $assessmentIds = $assessments->pluck('id')->all();

        $uploads = ProjectUpload::query()
            ->where('events_users_id', $member->id)
            ->whereIn('events_assessments_id', $assessmentIds)
            ->get(['id', 'events_assessments_id', 'file_name', 'file_path', 'score', 'created_at']);

        $uploadMap = [];
        foreach ($uploads as $u) {
            $uploadMap[$u->events_assessments_id] = $u;
        }

        $safeTitle = preg_replace('/[^a-zA-Z0-9-_]+/', '_', $session->title ?? 'session');
        $safeUser = preg_replace('/[^a-zA-Z0-9-_]+/', '_', $member->user?->name ?? ('user_' . $userId));
        $filename = "session_{$safeTitle}_{$safeUser}_report.csv";

        return response()->streamDownload(function () use ($session, $assessments, $member, $uploadMap) {
            $out = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'session_id',
                'session_title',
                'user_id',
                'user_name',
                'user_email',
                'assessment_id',
                'assessment_name',
                'file_name',
                'upload_date',
                'score',
            ]);

            $user = $member->user;

            foreach ($assessments as $assessment) {
                $upload = $uploadMap[$assessment->id] ?? null;

                fputcsv($out, [
                    $session[0],
                    null,
                   // $session[0]->title,
                    $user?->id ?? $member->users_id,
                    $user?->name ?? '',
                    $user?->email ?? '',
                    $assessment->id,
                    $assessment->name,
                    $upload?->file_name ?? 'file not uploaded',
                    $upload?->created_at?->toDateTimeString() ?? '',
                    $upload?->score ?? '',
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

}
