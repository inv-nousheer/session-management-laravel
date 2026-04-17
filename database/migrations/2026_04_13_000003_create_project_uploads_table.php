<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminar_id')->constrained('seminars')->onDelete('cascade');
            $table->foreignId('session_member_id')->constrained('session_members')->onDelete('cascade');
            $table->string('file_path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_uploads');
    }
};
