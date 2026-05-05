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
         Schema::table('events_users_events_assessments', function (Blueprint $table) {
            $table->unsignedTinyInteger('score')->nullable()->after('status')
                  ->comment('Score out of 10 assigned by the instructor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('events_users_events_assessments', function (Blueprint $table) {
            $table->dropColumn('score');
        });
    }
};
