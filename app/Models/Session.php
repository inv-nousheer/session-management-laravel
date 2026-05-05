<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Session extends Model
{
    use HasFactory;
    protected $table =  'events';

    protected $fillable = [
        'title',
        'description',
        'created_by',
        'date',
        'status',
        'tags'
    ];

    public function setTagsAttribute($value): void
    {
        if (is_array($value)) {
            $tags = array_values(array_filter(array_map(
                static fn ($t) => is_string($t) ? trim($t) : null,
                $value
            ), static fn ($t) => $t !== null && $t !== ''));

            $this->attributes['tags'] = implode(',', $tags);
            return;
        }

        $this->attributes['tags'] = is_string($value) ? trim($value) : $value;
    }

    // public function members()
    // {
    //     return $this->hasMany(SessionMember::class,'events_id');
    // }

    // public function uploads()
    // {
    //     return $this->hasMany(ProjectUpload::class);
    // }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'events_users',
            'events_id',
            'users_id'
        )->withTimestamps();
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function sessionMembers()
    {
        return $this->hasMany(SessionMember::class, 'events_id');
    }
    public function assessments()
    {
        return $this->hasMany(Assessment::class);
    }

}
