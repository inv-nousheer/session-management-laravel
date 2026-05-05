<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events_users_events_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('events_users_id')->constrained('events_users')->onDelete('cascade');
            $table->foreignId('events_assessments_id')->constrained('events_assessments')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_name');
            $table->tinyInteger('status')->default(1);
            $table->tinyInteger('is_submitted_late')->default(0)->comment('0 for on time, 1 for late');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events_users_events_assessments');
    }
};
