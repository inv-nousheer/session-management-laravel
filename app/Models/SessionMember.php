<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionMember extends Model
{
    use HasFactory;
    protected $table = 'events_users';

    protected $fillable = [
        'events_id',
        'users_id',
        'role',
        'status',
    ];

    public function session()
    {
        return $this->belongsTo(Session::class,'events_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class,'users_id');
    }



    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function assessments()
    {
        return $this->hasMany(Assessment::class,'events_id','events_id');
    }
    public function projectUploads()
    {
        return $this->hasMany(ProjectUpload::class,'events_users_id','id');
    }

    public function assessmentReopenRequests()
    {
        return $this->hasMany(AssessmentReopenRequest::class, 'events_users_id', 'id');
    }

    // public function comments()
    // {
    //     return $this->hasMany(Comment::class);
    // }
}
