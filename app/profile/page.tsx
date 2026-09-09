import ProfileForm from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your measurements</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Stored only in this browser — never uploaded anywhere. This is what
        every fit preview compares garments against.
      </p>
      <div className="mt-6">
        <ProfileForm />
      </div>
    </div>
  );
}
