<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AssessmentCreated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(private readonly array $mailData)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New assessment created: ' . $this->mailData['assessmentName'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.assessment-created',
            with: $this->mailData,
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
