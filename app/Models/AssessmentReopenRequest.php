<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentReopenRequest extends Model
{
    use HasFactory;

    protected $table = 'assessements_reopen_requests';

    protected $fillable = [
        'events_assessments_id',
        'events_users_id',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    public function assessmemnt()
    {
        return $this->belongsTo(Assessment::class, 'events_assessments_id', 'id');
    }

    public function sessionMember()
    {
        return $this->belongsTo(SessionMember::class, 'events_users_id', 'id');
    }
}

