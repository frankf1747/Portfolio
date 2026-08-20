import Landing from "@/components/Landing";
import { inviteMetadata } from "@/lib/invite";

/* To add another: copy this directory under a new name and change nothing
   else. Avoid names that collide with public/ ("work", "assets"), which are
   served as files. */
export const metadata = inviteMetadata;

export default function BioMarin() {
  return <Landing />;
}
