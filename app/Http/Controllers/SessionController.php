<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;
use App\Models\SessionMember;

class SessionController extends Controller
{
    // GET /api/sessions
    public function index()
    {
        return response()->json(Session::all());
    }

    // POST /api/sessions
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'created_by' => 'required',
        ]);
        $session = Session::create($validated);
        return response()->json($session, 201);
    }

    // GET /api/sessions/{id}
    public function show($id)
    {
        $session = Session::findOrFail($id);
        return response()->json($session);
    }

    // PUT /api/sessions/{id}
    public function update(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
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

    public function addMembers(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);
        foreach ($validated['user_ids'] as $userId) {
            SessionMember::updateOrCreate(
                ['seminar_id' => $session->id, 'user_id' => $userId],
                []
            );
        }
        $members = $session->members()
                    ->with('members.uploads')
                    ->with('user')
                    ->get();

        return response()->json($members);
    }
    public function getMembers($id)
    {
        $session = Session::findOrFail($id);
        $members = $session->members()
                    ->with('uploads')
                    ->with('user')
                    ->get();
        return response()->json($members);
    }
}
