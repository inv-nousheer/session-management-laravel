<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use App\Models\ProjectUpload;
use Illuminate\Validation\ValidationException;


class CommentController extends Controller
{
    // Display a listing of the comments
    public function index()
    {
        return response()->json(Comment::all());
    }

    // Store a newly created comment in storage
    public function store(Request $request)
    {
        $validated = $request->validate([
            'events_users_events_assessments_id' => 'required|exists:events_users_events_assessments,id',
            'events_assessments_id' => 'required|exists:events_assessments,id',
            'users_id' => 'required|exists:users,id',
            'comments' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $upload = ProjectUpload::query()->findOrFail($validated['events_users_events_assessments_id']);
        if ((int) $upload->events_assessments_id !== (int) $validated['events_assessments_id']) {
            throw ValidationException::withMessages([
                'events_assessments_id' => ['Assessment does not match this submission.'],
            ]);
        }

        $comment = Comment::create($validated);
        return response()->json($comment, 201);
    }

    // Display the specified comment
    public function show(Comment $comment)
    {
        return response()->json($comment);
    }

    // Update the specified comment in storage
    public function update(Request $request, Comment $comment)
    {
        $validated = $request->validate([
            'events_users_events_assessments_id' => 'sometimes|exists:events_users_events_assessments,id',
            'events_users_id' => 'sometimes|exists:events_users,id',
            'body' => 'sometimes|string',
        ]);
        $comment->update($validated);
        return response()->json($comment);
    }

    // Remove the specified comment from storage
    public function destroy(Comment $comment)
    {
        $comment->delete();
        return response()->json(null, 204);
    }
    public function updateScore(Request $request, int $id)
    {
        $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $upload = ProjectUpload::findOrFail($id);

        // Optional: restrict to session creator only
        // $sessionCreator = $upload->assessment->session->created_by;
        // if (Auth::id() !== $sessionCreator) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        $upload->score = $request->integer('score');
        $upload->save();

        return response()->json([
            'message' => 'Score updated successfully.',
            'upload'  => [
                'id'    => $upload->id,
                'score' => $upload->score,
            ],
        ]);
    }

}
