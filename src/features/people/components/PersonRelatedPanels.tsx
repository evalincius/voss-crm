function PlaceholderBlock({ title, description }: { title: string; description: string }) {
  return (
    <section className="card-surface bg-bg-surface space-y-2 p-6">
      <h4 className="text-text-primary text-lg font-semibold">{title}</h4>
      <p className="text-text-secondary text-base">{description}</p>
    </section>
  );
}

export function PersonRelatedPanels() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PlaceholderBlock
        title="Deals"
        description="Manual deal creation is available from this page. Full deal board integration lands in D4."
      />
      <PlaceholderBlock
        title="Campaign Memberships"
        description="Campaign membership workflows are introduced in D3."
      />
      <PlaceholderBlock
        title="Templates Used"
        description="Template usage visibility is introduced once templates and campaign links are implemented."
      />
    </div>
  );
}
