<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
     public function index()
    {
        return response()->json(User::all());
    }

    // POST /api/Users
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users|max:255',
            'name' => 'string|max:255',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,user',
        ]);
        $User = User::create($validated);
        return response()->json($User, 201);
    }

    // GET /api/Users/{id}
    public function show($id)
    {
        $User = User::findOrFail($id);
        return response()->json($User);
    }

    // PUT /api/Users/{id}
    public function update(Request $request, $id)
    {
        $User = User::findOrFail($id);
        $validated = $request->validate([
            'email' => 'sometimes|required|email|max:255',
            'name' => 'sometimes|required|string|max:255',
            'password' => 'sometimes|required|string|min:6',
            'role' => 'sometimes|required|string|in:admin,user',
        ]);
        $User->update($validated);
        return response()->json($User);
    }

    // DELETE /api/Users/{id}
    public function destroy($id)
    {
        $User = User::findOrFail($id);
        $User->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
