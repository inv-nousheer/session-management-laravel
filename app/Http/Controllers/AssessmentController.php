<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\SessionMember;
use App\Models\ProjectUpload;
use App\Models\Session;
use App\Models\AssessmentReopenRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssessmentController extends Controller
{
    public function index($id)
    {
        return response()->json(
            Assessment::with([
                'session.sessionMembers.user',
                'session.sessionMembers.projectUploads.comments.replies'
            ])
            ->where('events_id', $id)
            ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'events_id' => 'required|exists:events,id',
            'name' => 'required|string|max:255',
            'start_date_time' => 'required|date',
            'end_date_time' => 'required|date',
            'supporting_files' => 'file',
            'description' => 'nullable|string',
        ]);
        if($request->file('supporting_files')){
            $path = $request->file('supporting_files')->store('public/uploads');
        }else{
            $path = null;
        }
        $assessment = Assessment::create([
            'events_id' => $validated['events_id'],
            'name' => $validated['name'],
            'start_date_time' => $validated['start_date_time'],
            'end_date_time' => $validated['end_date_time'],
            'supporting_files' => $path,
            'description' => $validated['description'],

        ]);

        //$assessment = Assessment::create($validated);

        return response()->json($assessment, 201);
    }

    public function show($id)
    {
        $assessment = Assessment::findOrFail($id);
        return response()->json($assessment);
    }

    public function update(Request $request, $id)
    {
        $assessment = Assessment::findOrFail($id);

        $validated = $request->validate([
            'sessions_id' => 'sometimes|required|exists:seminars,id',
            'name' => 'sometimes|required|string|max:255',
            'end_date_time' => 'sometimes|required|date',
            'supporting_files' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $assessment->update($validated);

        return response()->json($assessment);
    }

    public function destroy($id)
    {
        $assessment = Assessment::findOrFail($id);
        $assessment->delete();

        return response()->json(['message' => 'Assessment deleted']);
    }

    public function forSession($id)
    {
        $session = Session::findOrFail($id);
        return response()->json(Assessment::where('sessions_id', $session->id)->get());
    }
    public function uploadProject(Request $request)
    {
       // return response()->json(['message' => 'Upload project endpoint']);
        $validated = $request->validate([
            'events_id' => 'required|exists:events,id',
            'file_path' => 'required|file|mimes:zip',
            'user_id' => 'required|exists:users,id',
            'assessment_id' => 'required|exists:events_assessments,id',
        ]);
        $session_member_id = SessionMember::where('events_id', $validated['events_id'])
        ->where('users_id', $validated['user_id'])
        ->firstOrFail()
        ->id;
         $path = $request->file('file_path')->store('public/uploads');
        $projectUpload = ProjectUpload::create([
            'events_users_id' => $session_member_id,
            'events_assessments_id' => $validated['assessment_id'],
            'file_path' => $path,
            'file_name' => $path,

        ]);

        return response()->json($projectUpload, 201);
    }
    public function download($id)
    {
        $upload = ProjectUpload::findOrFail($id);

        $path = $upload->file_path;

        if (!Storage::exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::download($path);

    }
    public function userAssessments($session_id, $user_id)
    {
        $session = Session::findOrFail($session_id);
        $assessments = Assessment::where('events_id', $session->id)->get();
        $sessionMember = SessionMember::where('events_id', $session_id)
            ->where('users_id', $user_id)
            ->first();
        $projectUploads = ProjectUpload::where('events_users_id', $sessionMember->id)->with('assessment')->with('comments')->get();

        return response()->json($projectUploads);
    }
    public function requestExtension(Request $request)
    {
        $validated = $request->validate([
            'assessment_id' => 'required|exists:events_assessments,id',
            'events_id' => 'required|exists:events,id',
            'user_id' => 'required|exists:users,id',
        ]);
        $session_member_id = SessionMember::where('events_id', $validated['events_id'])
        ->where('users_id', $validated['user_id'])
        ->firstOrFail()
        ->id;


        $assessmentReopenRequest = AssessmentReopenRequest::create([
            'events_assessments_id' => $validated['assessment_id'],
            'events_users_id' => $session_member_id,
            'status' => 0,
        ]);

        return response()->json(['message' => 'Extension requested']);
    }

    public function reopenRequestsForSession($sessionId)
    {
        Session::findOrFail($sessionId);

        $requests = AssessmentReopenRequest::with([
            'assessmemnt',
            'sessionMember.user',
            'sessionMember.session',
        ])
            ->whereHas('sessionMember', function ($q) use ($sessionId) {
                $q->where('events_id', $sessionId);
            })
            ->orderByDesc('id')
            ->get();

        return response()->json($requests);
    }

    public function updateReopenRequestStatus(Request $request, $id)
    {
        $reopenRequest = AssessmentReopenRequest::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|integer|in:1,2',
        ]);

        $reopenRequest->update($validated);

        return response()->json($reopenRequest);
    }
}
