<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    use HasFactory;

    protected $table = 'events_assessments';

    protected $fillable = [
        'events_id',
        'name',
        'start_date_time',
        'end_date_time',
        'supporting_files',
        'description',
        'status',
    ];

    public function session()
    {
        return $this->belongsTo(Session::class, 'events_id', 'id');
    }

    public function projectUploads()
    {
        return $this->hasMany(ProjectUpload::class, 'events_assessments_id','id');
    }
    public function reopenRequests()
    {
        return $this->hasMany(AssessmentReopenRequest::class, 'events_assessments_id', 'id');
    }


}
