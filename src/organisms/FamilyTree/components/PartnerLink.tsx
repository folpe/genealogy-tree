import { FamilyTreeNode } from "../FamilyTree.types";

interface PartnerLinkProps {
  source: FamilyTreeNode;
}

export const PartnerLink: React.FC<PartnerLinkProps> = ({ source }) => {
  if (!source.partner) return null;

  const startX = source.width!;
  const startY = 30; // Milieu du nœud source
  const endX = startX + 20; // Espace horizontal entre partenaires
  const endY = startY;

  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#666"
        strokeWidth={2}
      />
    </g>
  );
};
