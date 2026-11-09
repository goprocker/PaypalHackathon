import { SectionPage } from "@/components/section-page";

export default function FamilyPage() {
  return (
    <SectionPage
      section="family"
      features={[
        { title: "Family view", desc: "Shared spending across the household.", status: "live", href: "/hub?view=family" },
        { title: "Switch member", desc: "See the app as another family member.", status: "live", href: "/switch" },
        { title: "Privacy settings", desc: "Each member chooses what the family can see.", status: "soon" },
      ]}
    />
  );
}
