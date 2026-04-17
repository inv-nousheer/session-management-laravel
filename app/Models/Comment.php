<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_upload_id',
        'user_id',
        'body',
    ];

    public function projectUpload()
    {
        return $this->belongsTo(ProjectUpload::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
