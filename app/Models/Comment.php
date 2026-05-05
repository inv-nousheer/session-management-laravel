<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $table = 'comments';

    protected $fillable = [
        'events_users_events_assessments_id',
        'users_id',
        'comments',
        'parent_id',
    ];

//    public function sessionMember()
//     {
//         return $this->belongsTo(SessionMember::class, 'events_users_id', 'id');
//     }

    public function projectUpload()
    {
        return $this->belongsTo(ProjectUpload::class);
    }
     // 🔼 Parent comment
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    // 🔽 Child comments (replies)
    public function replies()
    {
       return $this->hasMany(Comment::class, 'parent_id')->with('replies');
    }
}
