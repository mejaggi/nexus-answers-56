const TypingIndicator = () => {
  return (
    <div className="flex gap-4 p-6 rounded-xl bg-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold text-sm shadow-soft bg-gradient-accent text-accent-foreground">
        AI
      </div>
      <div className="flex items-center gap-1.5 py-4">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
};

export { TypingIndicator };
