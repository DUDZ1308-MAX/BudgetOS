interface Props {
  error?: string | null;
  touched?: boolean;
}

export function InlineValidation({ error, touched }: Props) {
  if (!error || !touched) return null;
  return (
    <p className="mt-1 text-xs text-red-500" role="alert">
      {error}
    </p>
  );
}
