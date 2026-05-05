<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ImportUsersController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $imported = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            $validator = Validator::make($data, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                // 'password' => 'required|string|min:6',
                // 'role' => 'required|string|in:member,admin,tl,user',
            ]);
            if ($validator->fails()) {
                $errors[] = [
                    'row' => $row,
                    'errors' => $validator->errors()->all(),
                ];
                continue;
            }
            $data['password'] = Hash::make('password');
            $data['role'] = 'member';
            User::create($data);
            $imported++;
        }
        fclose($handle);

        return response()->json([
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }
}
