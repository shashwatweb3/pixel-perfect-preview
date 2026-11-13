export type BuilderProfile = {
  name: string;
  role: string;
  bio: string;
  skills: string[];
  passItOn: string;
};

export const SAMPLE_BUILDER: BuilderProfile = {
  name: "Aanya Shah",
  role: "Protocol designer · Mumbai",
  bio: "Building clear developer paths for teams experimenting with Vara.",
  skills: ["Sails", "Product systems", "Community"],
  passItOn: "Happy to introduce early builders to useful technical collaborators.",
};
