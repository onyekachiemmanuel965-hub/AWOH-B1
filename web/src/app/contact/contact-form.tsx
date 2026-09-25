"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Presentational contact form only.
 * No email-delivery backend exists yet — do not pretend messages are sent.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(
      "Contact form delivery is not yet configured. Please use the channels AWOH-B confirms once business details are available.",
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        id="contact-name"
        label="Name"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="contact-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="type-label text-primary">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 type-body text-primary outline-none transition-colors focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </div>
      {notice ? (
        <p className="type-body-sm text-text-muted" role="status">
          {notice}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto">
        Send enquiry
      </Button>
      <p className="type-caption text-text-muted">
        Form delivery infrastructure remains pending. This page does not send
        messages yet.
      </p>
    </form>
  );
}
