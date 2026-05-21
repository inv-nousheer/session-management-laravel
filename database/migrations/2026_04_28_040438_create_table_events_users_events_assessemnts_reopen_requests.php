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
        Schema::create('assessements_reopen_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('events_assessments_id')->constrained('events_assessments')->onDelete('cascade');
            $table->foreignId('events_users_id')->constrained('events_users')->onDelete('cascade');
            $table->tinyInteger('status')->default(0)->comment('0 for pending, 1 for approved, 2 for rejected');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events_users_events_assessements_reopen_requests');
    }
};
