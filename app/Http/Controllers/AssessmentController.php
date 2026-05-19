<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\SessionMember;
use App\Models\ProjectUpload;
use App\Models\Session;
use App\Models\AssessmentReopenRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Comment;
use Illuminate\Support\Facades\Log;


class AssessmentController extends Controller
{
    public function index($id)
    {
        return response()->json(
            Assessment::with([
                'reopenRequests',
                'comments',
                'session.sessionMembers.user',
                // 'session.sessionMembers.projectUploads' => function ($query) {
                //     $query->whereColumn('events_assessments_id', 'id');
                // },
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
        return response()->json(Assessment::where('events_id', $session->id)->orderBy('id')->get());
    }
    public function uploadProject(Request $request)
    {
        try {
            $validated = $request->validate([
                'events_id' => 'required|exists:events,id',
                'user_id' => 'required|exists:users,id',
                'assessment_id' => 'required|exists:events_assessments,id',
                'file_path' => 'required_without:submission_link|file|mimes:zip',
                'submission_link' => 'required_without:file_path|url|max:2048',
                'notes' => 'nullable|string|max:2000',
            ]);

            $session_member_id = SessionMember::where('events_id', $validated['events_id'])
                ->where('users_id', $validated['user_id'])
                ->firstOrFail()
                ->id;

            if ($request->hasFile('file_path')) {
                $path = $request->file('file_path')->store('public/uploads');
                $fileName = $request->file('file_path')->getClientOriginalName();
                $commentText = 'New file uploaded';
            } else {
                $path = $validated['submission_link'];
                $fileName = $path;
                $commentText = 'Project link submitted';
            }

            if (!empty($validated['notes'])) {
                $commentText .= ': ' . $validated['notes'];
            }

            $projectUpload = ProjectUpload::create([
                'events_users_id' => $session_member_id,
                'events_assessments_id' => $validated['assessment_id'],
                'file_path' => $path,
                'file_name' => $fileName,
            ]);

            Comment::create([
                'events_users_events_assessments_id' => $projectUpload->id,
                'events_assessments_id' => $validated['assessment_id'],
                'users_id' => $validated['user_id'],
                'comments' => $commentText,
            ]);

            return response()->json($projectUpload, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error uploading project: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Upload max filesize: ' . ini_get('upload_max_filesize'));
            Log::error('Post max size: ' . ini_get('post_max_size'));
            return response()->json(['message' => 'Failed to submit project'], 500);
        }
    }
    public function download($id)
    {
        $upload = ProjectUpload::findOrFail($id);

        $path = $upload->file_path;

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return redirect()->away($path);
        }

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
        $projectUploads = ProjectUpload::where('events_users_id', $sessionMember->id)->with('assessment.comments')->with('comments')->get();

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
