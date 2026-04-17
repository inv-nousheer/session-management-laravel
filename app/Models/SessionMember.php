<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'user_id',
    ];

    public function session()
    {
        return $this->belongsTo(Session::class,'seminar_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function uploads()
    {
        return $this->hasMany(ProjectUpload::class);
    }
}
