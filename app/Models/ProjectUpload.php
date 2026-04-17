<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'session_member_id',
        'file_path',
    ];

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function sessionMember()
    {
        return $this->belongsTo(SessionMember::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
