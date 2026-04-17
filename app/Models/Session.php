<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Session extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'created_by',
    ];
    protected $table = 'seminars';

    public function members()
    {
        return $this->hasMany(SessionMember::class,'seminar_id');
    }

    public function uploads()
    {
        return $this->hasMany(ProjectUpload::class);
    }
}
