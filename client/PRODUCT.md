# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Individual users seeking a fast, private AI assistant for daily tasks — coding help, writing, analysis, brainstorming, learning. They value speed, clarity, and a calm interface that doesn't compete with their thinking.

## Product Purpose

JARVIS is a Gemini-powered AI assistant that runs locally in the browser. It makes conversational AI feel immediate and private — no account, no cloud sync, conversations stored locally. Success means the visitor opens it, types a question, gets a useful answer, and returns because it stayed out of their way.

## Positioning

The only AI chat that loads instantly, works offline-first, and keeps every conversation on the user's device. No server sees your prompts.

## Operating Context

- Desktop web (primary), mobile web (secondary)
- Local-first: all history in localStorage
- Streams responses from a local/self-hosted backend
- No auth, no accounts, no telemetry
- Keyboard-first interaction (⌘K new chat, Enter to send)

## Capabilities and Constraints

- Markdown rendering with code syntax highlighting
- Math equations (LaTeX inline and block)
- Copy message / copy code blocks
- Theme toggle (light/dark, persists)
- Conversation history with rename/delete
- Streaming token-by-token response animation
- Max conversation length limited by localStorage quota
- Backend endpoint configurable via VITE_CHAT_URL

## Brand Commitments

- Name: JARVIS (fixed)
- Mark: Lightning bolt (fixed)
- Voice: Direct, helpful, no personality theater
- Accent: Warm amber/orange (Claude-like)
- Type: Geist Variable (system UI), Geist Mono Variable (code)

## Evidence on Hand

- Working chat interface with streaming
- localStorage persistence
- Theme switching
- Marked + DOMPurify for markdown
- Bootstrap Icons for UI icons

## Product Principles

1. **Calm over clever** — The interface recedes; the conversation leads.
2. **Local-first honesty** — No phantom cloud features; what you see is what runs on your machine.
3. **Keyboard-native** — Every frequent action has a shortcut; mouse is optional.
4. **Trust the model** — No guardrail theater, no synthetic "thinking" UI. The response speaks for itself.

## Accessibility & Inclusion

- WCAG AA contrast in both themes
- Focus-visible outlines on all interactive elements
- Reduced-motion respected
- ARIA labels on icon-only controls
- Semantic HTML structure