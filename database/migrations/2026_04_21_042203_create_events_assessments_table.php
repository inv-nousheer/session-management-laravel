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
         Schema::create('events_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('events_id')->constrained('events')->onDelete('cascade');
            $table->string('name');
            $table->dateTime('start_date_time');
            $table->dateTime('end_date_time');
            $table->text('supporting_files')->nullable();
            $table->text('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events_assessments');
    }
};
