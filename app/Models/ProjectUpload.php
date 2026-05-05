<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectUpload extends Model
{
    use HasFactory;
    protected $table = 'events_users_events_assessments';

    protected $fillable = [
        'events_users_id',
        'events_assessments_id',
        'file_name',
        'file_path',
        'status',
        'is_submitted_late',
        'file_path',
        'score'
    ];

   public function sessionMember()
    {
        return $this->belongsTo(SessionMember::class);
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class, 'events_assessments_id', 'id');
    }

    public function comments()
    {
        //return $this->hasOne(Comment::class, 'events_users_events_assessments_id', 'id');
         return $this->hasMany(Comment::class, 'events_users_events_assessments_id')
                ->whereNull('parent_id') // only top-level
                ->with('replies');       // load replies
    }

}
